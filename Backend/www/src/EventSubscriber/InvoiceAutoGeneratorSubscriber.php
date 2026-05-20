<?php

namespace App\EventSubscriber;

use App\Entity\Invoice;
use App\Entity\LineInvoice;
use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\PdfService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Twig\Environment;

class InvoiceAutoGeneratorSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserRepository $userRepo,
        private TokenStorageInterface $tokenStorage,
        private PdfService $pdfService,
        private Environment $twig
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => 'onKernelRequest',
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        $request = $event->getRequest();
        $path = $request->getPathInfo();

        // Se déclenche uniquement sur les appels API de factures ou de conformité admin
        if (!str_starts_with($path, '/api/invoices') && 
            !str_starts_with($path, '/api/admin/rgpd')) {
            return;
        }

        $token = $this->tokenStorage->getToken();
        if (!$token) {
            return;
        }

        $currentUser = $token->getUser();
        if (!$currentUser instanceof User) {
            return;
        }

        if (in_array('ROLE_ADMIN', $currentUser->getRoles())) {
            // L'administrateur a besoin de voir toutes les factures conformes pour tous les propriétaires
            $owners = $this->userRepo->findBy(['isOwner' => true]);
            foreach ($owners as $owner) {
                $this->generateMissingRetributionsForOwner($owner);
            }
        } elseif ($currentUser->isOwner()) {
            // Le propriétaire ne génère que ses propres factures
            $this->generateMissingRetributionsForOwner($currentUser);
        }
    }

    private function generateMissingRetributionsForOwner(User $owner): void
    {
        $contractStart = $owner->getContractDate();
        if (!$contractStart) {
            return;
        }

        $startYear = (int)$contractStart->format('Y');
        $currentYear = (int)(new \DateTime())->format('Y');
        $today = new \DateTime();
        $newInvoices = [];

        for ($year = $startYear; $year <= $currentYear; $year++) {
            // Fin de la saison ciblée (10 octobre à 23h59m59s)
            $seasonEnd = new \DateTime("$year-10-10 23:59:59");

            // RÈGLE : Ne JAMAIS générer la facture d'une saison avant qu'elle ne soit terminée !
            if ($today < $seasonEnd) {
                continue;
            }

            // Vérifier si une facture de rétribution existe déjà pour cette saison
            $existing = $this->em->getRepository(Invoice::class)->createQueryBuilder('i')
                ->where('i.person = :person')
                ->andWhere('i.title LIKE :pattern')
                ->setParameter('person', $owner->getFirstname() . ' ' . $owner->getLastname())
                ->setParameter('pattern', "RET-$year-%")
                ->getQuery()
                ->getResult();

            if (!empty($existing)) {
                // S'il existe déjà en base, on s'assure que le fichier PDF physique existe sur le disque.
                // Si le fichier a été supprimé ou est manquant, on le régénère.
                foreach ($existing as $inv) {
                    $physicalPath = __DIR__ . '/../../public' . $inv->getPath();
                    if ($inv->getPath() && $inv->getPath() !== 'generation_en_attente' && !file_exists($physicalPath)) {
                        $html = $this->twig->render('invoice/pdf.html.twig', [
                            'invoice' => $inv,
                        ]);
                        $filename = $inv->getTitle() . '.pdf';
                        $this->pdfService->generateAndSavePdf($html, $filename);
                    }
                }
                continue;
            }

            // Calculer la rétribution pour les réservations payées de cette saison
            $totalRetributionCents = 0;
            $lineItems = [];
            $products = $owner->getProducts();

            foreach ($products as $product) {
                foreach ($product->getReservation() as $res) {
                    if (!$res->getIsPaid() || $res->getUser() === $owner) {
                        continue;
                    }

                    $start = $res->getStartDate();
                    $end = $res->getEndDate();
                    if (!$start || !$end || (int)$start->format('Y') !== $year) {
                        continue;
                    }

                    $nights = $start->diff($end)->days;
                    if ($nights <= 0) {
                        continue;
                    }

                    $priceObj = $product->getPrices()->first();
                    $basePriceCents = $priceObj ? $priceObj->getPrice() : 0;
                    if ($basePriceCents <= 0) {
                        continue;
                    }

                    // Calcul de la tarification journalière saisonnière
                    $resRentCents = 0;
                    $currentDate = clone $start;
                    while ($currentDate < $end) {
                        $month = (int)$currentDate->format('m');
                        $day = (int)$currentDate->format('d');
                        
                        // Haute saison : 21 juin au 31 août (+15%)
                        $isHighSeason = (($month === 6 && $day >= 21) || $month === 7 || $month === 8);
                        $dayPriceCents = $isHighSeason ? (int)round($basePriceCents * 1.15) : $basePriceCents;
                        $resRentCents += $dayPriceCents;
                        $currentDate->modify('+1 day');
                    }

                    // Remises de 5% par tranche de 7 jours de location
                    $weeks = (int)floor($nights / 7);
                    if ($weeks > 0) {
                        $discountPercent = min($weeks * 5, 25);
                        $resRentCents = (int)round($resRentCents * (1 - ($discountPercent / 100)));
                    }

                    // Rétribution = 35% de la location payée
                    $retributionCents = (int)round($resRentCents * 0.35);

                    if ($retributionCents > 0) {
                        $totalRetributionCents += $retributionCents;
                        $lineItems[] = [
                            'desc' => sprintf(
                                "Rétribution séjour locataire du %s au %s sur le bien %s (%d nuit(s))",
                                $start->format('d/m/Y'),
                                $end->format('d/m/Y'),
                                $product->getTitle(),
                                $nights
                            ),
                            'amount' => $retributionCents
                        ];
                    }
                }
            }

            // Génération physique de la facture s'il y a des gains accumulés
            if ($totalRetributionCents > 0) {
                $invoice = new Invoice();
                $invoice->setTitle(sprintf("RET-%d-%d-%d", $year, $owner->getId(), random_int(1000, 9999)));
                $invoice->setPerson($owner->getFirstname() . ' ' . $owner->getLastname());
                // Date d'émission : exactement à la clôture de la saison, le 10 octobre
                $invoice->setCreatedAt(new \DateTime("$year-10-10 18:00:00"));
                $invoice->setPath(sprintf("/uploads/invoices/%s.pdf", $invoice->getTitle()));

                foreach ($lineItems as $item) {
                    $line = new LineInvoice();
                    $line->setLineProduct($item['desc']);
                    $line->setLinePrice($item['amount']);
                    $invoice->addLineInvoice($line);
                    $this->em->persist($line);
                }

                // Synthèse finale
                $totalLine = new LineInvoice();
                $totalLine->setLineProduct(sprintf("VERSEMENT GLOBAL DE RETRIBUTION PROPRIETAIRE - SAISON %d", $year));
                $totalLine->setLinePrice($totalRetributionCents);
                $invoice->addLineInvoice($totalLine);
                $this->em->persist($totalLine);

                $this->em->persist($invoice);
                $newInvoices[] = $invoice;
            }
        }

        $this->em->flush();

        // Générer et écrire physiquement le fichier PDF sur le disque
        foreach ($newInvoices as $invoice) {
            $html = $this->twig->render('invoice/pdf.html.twig', [
                'invoice' => $invoice,
            ]);
            $filename = $invoice->getTitle() . '.pdf';
            $pdfPathRelative = $this->pdfService->generateAndSavePdf($html, $filename);
            $invoice->setPath($pdfPathRelative);
        }

        if (!empty($newInvoices)) {
            $this->em->flush();
        }
    }
}

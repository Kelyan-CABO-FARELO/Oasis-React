<?php

namespace App\Command;

use App\Entity\Invoice;
use App\Entity\LineInvoice;
use App\Entity\User;
use App\Entity\Reservation;
use App\Repository\UserRepository;
use App\Service\PdfService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Twig\Environment;

#[AsCommand(
    name: 'app:owner:generate-retributions',
    description: 'Calcule les gains des propriétaires et génère automatiquement les factures de rétribution à la fin de la saison (10 octobre).',
)]
class GenerateRetributionsCommand extends Command
{
    public function __construct(
        private UserRepository $userRepo,
        private EntityManagerInterface $em,
        private PdfService $pdfService,
        private Environment $twig
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('year', 'y', InputOption::VALUE_REQUIRED, 'Année de la saison pour laquelle générer les rétributions.', date('Y'))
            ->addOption('force', 'f', InputOption::VALUE_NONE, 'Forcer la génération même si la date du 10 octobre n\'est pas encore dépassée.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $year = (int)$input->getOption('year');
        $force = $input->getOption('force');

        $seasonEnd = new \DateTime("$year-10-10 23:59:59");
        $now = new \DateTime();

        $io->title("Génération automatique des factures de rétribution propriétaires - Saison $year");

        if ($now < $seasonEnd && !$force) {
            $io->error(sprintf(
                "La saison %d n'est pas encore terminée (clôture le 10 octobre %d). Utilisez l'option --force ou -f pour forcer la génération anticipée.",
                $year,
                $year
            ));
            return Command::FAILURE;
        }

        $owners = $this->userRepo->findBy(['isOwner' => true]);
        $generatedCount = 0;
        $newInvoices = [];

        foreach ($owners as $owner) {
            $products = $owner->getProducts();
            if ($products->isEmpty()) {
                continue;
            }

            // Vérifier si une facture de rétribution existe déjà pour cet utilisateur pour cette saison
            $existingInvoice = $this->em->getRepository(Invoice::class)->createQueryBuilder('i')
                ->where('i.person = :person')
                ->andWhere('i.title LIKE :pattern')
                ->setParameter('person', $owner->getFirstname() . ' ' . $owner->getLastname())
                ->setParameter('pattern', "RET-$year-%")
                ->getQuery()
                ->getResult();

            if (!empty($existingInvoice)) {
                $io->note(sprintf("Le propriétaire %s %s possède déjà une facture de rétribution pour la saison %d. Passé.", $owner->getFirstname(), $owner->getLastname(), $year));
                continue;
            }

            $totalRetributionCents = 0;
            $lineItems = [];

            // Parcourir les produits du propriétaire
            foreach ($products as $product) {
                // Parcourir les réservations payées de ce produit
                foreach ($product->getReservation() as $res) {
                    if (!$res->getIsPaid()) {
                        continue;
                    }

                    // Ignorer les réservations de séjour privé du proprio
                    if ($res->getUser() === $owner) {
                        continue;
                    }

                    $start = $res->getStartDate();
                    $end = $res->getEndDate();

                    if (!$start || !$end) {
                        continue;
                    }

                    // Ne prendre en compte que l'année ciblée
                    if ((int)$start->format('Y') !== $year) {
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

                    // Calcul de la location totale avec tarification journalière saisonnière
                    $resRentCents = 0;
                    $currentDate = clone $start;
                    while ($currentDate < $end) {
                        $month = (int)$currentDate->format('m');
                        $day = (int)$currentDate->format('d');

                        // Haute saison : du 21 juin au 31 août (+15%)
                        $isHighSeason = (($month === 6 && $day >= 21) || $month === 7 || $month === 8);
                        $dayPriceCents = $isHighSeason ? (int)round($basePriceCents * 1.15) : $basePriceCents;
                        $resRentCents += $dayPriceCents;
                        $currentDate->modify('+1 day');
                    }

                    // Application des remises par tranches de 7 jours
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

            // Si des gains sont cumulés pour cet owner, on émet la facture
            if ($totalRetributionCents > 0) {
                $invoice = new Invoice();
                $invoice->setTitle(sprintf("RET-%d-%d-%d", $year, $owner->getId(), random_int(1000, 9999)));
                $invoice->setPerson($owner->getFirstname() . ' ' . $owner->getLastname());
                // Date d'émission : exactement à la clôture de la saison, le 10 octobre à 18h
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
                $generatedCount++;

                $io->success(sprintf(
                    "Facture %s générée pour %s %s (Montant total : %.2f €).",
                    $invoice->getTitle(),
                    $owner->getFirstname(),
                    $owner->getLastname(),
                    $totalRetributionCents / 100
                ));
            }
        }

        $this->em->flush();

        // Générer physiquement les fichiers PDF
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

        $io->success(sprintf("Succès ! %d facture(s) de rétribution générée(s) pour la saison %d.", $generatedCount, $year));

        return Command::SUCCESS;
    }
}

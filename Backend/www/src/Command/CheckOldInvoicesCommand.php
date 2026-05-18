<?php

namespace App\Command;

use App\Entity\User;
use App\Entity\Invoice;
use App\Entity\Reservation;
use App\Repository\UserRepository;
use App\Repository\InvoiceRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:rgpd:cleanup',
    description: 'Vérifie, alerte et nettoie les données selon les règles RGPD (factures > 3 ans, locataires et propriétaires expirés).',
)]
class CheckOldInvoicesCommand extends Command
{
    private $invoiceRepo;
    private $userRepo;
    private $em;

    public function __construct(InvoiceRepository $invoiceRepo, UserRepository $userRepo, EntityManagerInterface $em)
    {
        parent::__construct();
        $this->invoiceRepo = $invoiceRepo;
        $this->userRepo = $userRepo;
        $this->em = $em;
    }

    protected function configure(): void
    {
        $this
            ->addOption('purge', null, InputOption::VALUE_NONE, 'Exécuter la purge et anonymisation effective des données.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $purge = $input->getOption('purge');
        $now = new \DateTime();

        $io->title("Vérification de la conformité RGPD - Oasis Camping");

        // 1. ANALYSE FACTURES > 3 ANS
        $threeYearsAgo = new \DateTime('-3 years');
        $oldInvoices = $this->invoiceRepo->createQueryBuilder('i')
            ->where('i.createdAt <= :limitDate')
            ->setParameter('limitDate', $threeYearsAgo)
            ->getQuery()
            ->getResult();

        if (count($oldInvoices) > 0) {
            $io->warning(count($oldInvoices) . " facture(s) ont plus de 3 ans et doivent être supprimées de l'espace numérique !");
            foreach ($oldInvoices as $inv) {
                $io->text(sprintf("- [%s] Facture %s (Client: %s)", $inv->getCreatedAt()->format('Y-m-d'), $inv->getTitle(), $inv->getPerson()));
            }
        } else {
            $io->success("Aucune facture de plus de 3 ans trouvée.");
        }

        // 2. ANALYSE LOCATAIRES EXPIRÉS (1 SEMAINE / 1 AN)
        $allUsers = $this->userRepo->findAll();
        $expiredGuests = [];
        $expiredOwners = [];

        foreach ($allUsers as $u) {
            if (in_array('ROLE_ADMIN', $u->getRoles()) || str_starts_with($u->getEmail() ?? '', 'anonyme_')) {
                continue;
            }

            if ($u->isOwner()) {
                // Propriétaire expiré
                $contractStart = $u->getContractDate();
                if (!$contractStart) {
                    continue;
                }

                $contractEnd = new \DateTime($contractStart->format('Y') . '-10-10');
                if ($contractStart > $contractEnd) {
                    $contractEnd->modify('+1 year');
                }

                $duration = 1;
                if ($u->getProducts()->first()) {
                    $duration = $u->getProducts()->first()->getDuration() ?? 1;
                }

                if ($duration > 1) {
                    $contractEnd->modify('+' . ($duration - 1) . ' years');
                }

                if ($now > $contractEnd) {
                    $expiredOwners[] = $u;
                }
            } else {
                // Locataire expiré
                $lastStayEnd = null;
                foreach ($u->getReservations() as $res) {
                    if ($res->getIsPaid()) {
                        $endDate = $res->getEndDate();
                        if ($lastStayEnd === null || $endDate > $lastStayEnd) {
                            $lastStayEnd = $endDate;
                        }
                    }
                }

                if ($lastStayEnd === null) {
                    $lastStayEnd = $u->getCreatedAt() ?? new \DateTime('-2 years');
                }

                $daysSinceLastStay = $now->diff($lastStayEnd)->days;
                $isPastOneWeek = $daysSinceLastStay > 7;
                $isPastOneYear = $daysSinceLastStay > 365;

                $isExpired = false;
                if ($isPastOneYear) {
                    $isExpired = true;
                } elseif ($isPastOneWeek && !$u->isConsentDataRetention()) {
                    $isExpired = true;
                }

                if ($isExpired) {
                    $expiredGuests[] = $u;
                }
            }
        }

        if (count($expiredGuests) > 0) {
            $io->warning(count($expiredGuests) . " compte(s) locataires ont dépassé la durée légale de conservation des données !");
            foreach ($expiredGuests as $g) {
                $io->text(sprintf("- %s %s (%s)", $g->getFirstname(), $g->getLastname(), $g->getEmail()));
            }
        } else {
            $io->success("Aucun compte locataire expiré.");
        }

        if (count($expiredOwners) > 0) {
            $io->warning(count($expiredOwners) . " contrat(s) de propriétaires sont expirés et non renouvelés !");
            foreach ($expiredOwners as $o) {
                $io->text(sprintf("- %s %s (%s) - Contrat expiré", $o->getFirstname(), $o->getLastname(), $o->getEmail()));
            }
        } else {
            $io->success("Aucun contrat propriétaire expiré.");
        }

        // 3. PURGE & ANONYMISATION EFFECTIVE
        if ($purge) {
            $io->section("Exécution du nettoyage RGPD...");

            // Purge factures
            $purgedInvoicesCount = 0;
            foreach ($oldInvoices as $inv) {
                $pdfPath = $inv->getPath();
                if ($pdfPath && $pdfPath !== 'generation_en_attente') {
                    // Suppression PDF
                    $absolutePath = __DIR__ . '/../../public' . $pdfPath;
                    if (file_exists($absolutePath)) {
                        @unlink($absolutePath);
                    }
                }

                $res = $this->em->getRepository(Reservation::class)->findOneBy(['invoice' => $inv]);
                if ($res) {
                    $res->setInvoice(null);
                }

                $this->em->remove($inv);
                $purgedInvoicesCount++;
            }

            // Anonymisation locataires
            $anonymizedGuestsCount = 0;
            foreach ($expiredGuests as $g) {
                $id = $g->getId();
                $g->setEmail("anonyme_locataire_" . $id . "@loasis.com");
                $g->setFirstname("Anonyme");
                $g->setLastname("Locataire");
                $g->setMobile(null);
                $g->setIsActive(false);
                $g->setPassword(bin2hex(random_bytes(16)));
                $g->setConsentDataRetention(false);
                $anonymizedGuestsCount++;
            }

            // Anonymisation propriétaires
            $anonymizedOwnersCount = 0;
            foreach ($expiredOwners as $o) {
                $id = $o->getId();
                $o->setEmail("anonyme_proprio_" . $id . "@loasis.com");
                $o->setFirstname("Anonyme");
                $o->setLastname("Propriétaire");
                $o->setMobile(null);
                $o->setIsOwner(false);
                $o->setIsActive(false);
                $o->setPassword(bin2hex(random_bytes(16)));

                foreach ($o->getProducts() as $prod) {
                    $o->removeProduct($prod);
                }

                $anonymizedOwnersCount++;
            }

            $this->em->flush();

            $io->success(sprintf("Nettoyage terminé : %d factures supprimées, %d locataires anonymisés, %d propriétaires anonymisés.", $purgedInvoicesCount, $anonymizedGuestsCount, $anonymizedOwnersCount));
        } else {
            $io->note("Relancez la commande avec l'option --purge pour exécuter le nettoyage effectif.");
        }

        return Command::SUCCESS;
    }
}

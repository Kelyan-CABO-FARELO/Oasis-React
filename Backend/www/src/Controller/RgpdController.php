<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\Invoice;
use App\Entity\Reservation;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/admin/rgpd')]
class RgpdController extends AbstractController
{
    private $em;
    private $userRepo;

    public function __construct(EntityManagerInterface $em, UserRepository $userRepo)
    {
        $this->em = $em;
        $this->userRepo = $userRepo;
    }

    private function getRgpdData(): array
    {
        $allUsers = $this->userRepo->findAll();
        $now = new \DateTime();

        $expiredGuests = [];
        $expiredOwners = [];

        foreach ($allUsers as $u) {
            // Ne pas anonymiser les admins ni les utilisateurs déjà anonymisés
            if (in_array('ROLE_ADMIN', $u->getRoles()) || str_starts_with($u->getEmail() ?? '', 'anonyme_')) {
                continue;
            }

            if ($u->isOwner()) {
                // Analyse Propriétaire Expiré
                $contractStart = $u->getContractDate();
                if (!$contractStart) {
                    continue;
                }

                // Fin de saison (10 Octobre de l'année de signature)
                $contractEnd = new \DateTime($contractStart->format('Y') . '-10-10');
                if ($contractStart > $contractEnd) {
                    $contractEnd->modify('+1 year');
                }

                // Récupération de la durée en saisons
                $duration = 1;
                if ($u->getProducts()->first()) {
                    $duration = $u->getProducts()->first()->getDuration() ?? 1;
                }

                if ($duration > 1) {
                    $contractEnd->modify('+' . ($duration - 1) . ' years');
                }

                if ($now > $contractEnd) {
                    $expiredOwners[] = [
                        'id' => $u->getId(),
                        'firstname' => $u->getFirstname(),
                        'lastname' => $u->getLastname(),
                        'email' => $u->getEmail(),
                        'contractEnd' => $contractEnd->format('Y-m-d'),
                        'daysExpired' => $now->diff($contractEnd)->days
                    ];
                }
            } else {
                // Analyse Locataire Expiré (Règle 1 semaine / 1 an)
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
                $reason = '';

                if ($isPastOneYear) {
                    $isExpired = true;
                    $reason = "Délai de conservation maximal dépassé (1 an)";
                } elseif ($isPastOneWeek && !$u->isConsentDataRetention()) {
                    $isExpired = true;
                    $reason = "Délai d'une semaine dépassé (Pas d'accord de conservation)";
                }

                if ($isExpired) {
                    $expiredGuests[] = [
                        'id' => $u->getId(),
                        'firstname' => $u->getFirstname(),
                        'lastname' => $u->getLastname(),
                        'email' => $u->getEmail(),
                        'lastStay' => $lastStayEnd->format('Y-m-d'),
                        'consent' => $u->isConsentDataRetention() ?? false,
                        'reason' => $reason,
                        'days' => $daysSinceLastStay
                    ];
                }
            }
        }

        // Analyse Factures de plus de 3 ans
        $threeYearsAgo = new \DateTime('-3 years');
        $oldInvoicesEntities = $this->em->getRepository(Invoice::class)->createQueryBuilder('i')
            ->where('i.createdAt <= :limitDate')
            ->setParameter('limitDate', $threeYearsAgo)
            ->getQuery()
            ->getResult();

        $oldInvoices = [];
        foreach ($oldInvoicesEntities as $inv) {
            $oldInvoices[] = [
                'id' => $inv->getId(),
                'title' => $inv->getTitle(),
                'person' => $inv->getPerson(),
                'createdAt' => $inv->getCreatedAt()->format('Y-m-d'),
                'path' => $inv->getPath()
            ];
        }

        return [
            'expiredGuests' => $expiredGuests,
            'expiredOwners' => $expiredOwners,
            'oldInvoices' => $oldInvoices
        ];
    }

    #[Route('/status', name: 'app_admin_rgpd_status', methods: ['GET'])]
    public function status(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');
        $data = $this->getRgpdData();

        return $this->json([
            'complianceScore' => (count($data['expiredGuests']) === 0 && count($data['expiredOwners']) === 0 && count($data['oldInvoices']) === 0) ? 100 : 75,
            'expiredGuestsCount' => count($data['expiredGuests']),
            'expiredOwnersCount' => count($data['expiredOwners']),
            'oldInvoicesCount' => count($data['oldInvoices']),
            'expiredGuests' => $data['expiredGuests'],
            'expiredOwners' => $data['expiredOwners'],
            'oldInvoices' => $data['oldInvoices']
        ]);
    }

    #[Route('/cleanup', name: 'app_admin_rgpd_cleanup', methods: ['POST'])]
    public function cleanup(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');
        $data = $this->getRgpdData();
        $purgedInvoicesCount = 0;
        $anonymizedGuestsCount = 0;
        $anonymizedOwnersCount = 0;

        // 1. Purge des Factures (> 3 ans)
        foreach ($data['oldInvoices'] as $invData) {
            $inv = $this->em->getRepository(Invoice::class)->find($invData['id']);
            if ($inv) {
                // Suppression fichier PDF
                $pdfPath = $inv->getPath();
                if ($pdfPath && $pdfPath !== 'generation_en_attente') {
                    $absolutePath = $this->getParameter('kernel.project_dir') . '/public' . $pdfPath;
                    if (file_exists($absolutePath)) {
                        @unlink($absolutePath);
                    }
                }

                // Dissociation de la réservation pour éviter les contraintes
                $res = $this->em->getRepository(Reservation::class)->findOneBy(['invoice' => $inv]);
                if ($res) {
                    $res->setInvoice(null);
                }

                $this->em->remove($inv);
                $purgedInvoicesCount++;
            }
        }

        // 2. Anonymisation des Locataires
        foreach ($data['expiredGuests'] as $guestData) {
            $u = $this->userRepo->find($guestData['id']);
            if ($u) {
                $id = $u->getId();
                $u->setEmail("anonyme_locataire_" . $id . "@loasis.com");
                $u->setFirstname("Anonyme");
                $u->setLastname("Locataire");
                $u->setMobile(null);
                $u->setIsActive(false);
                $u->setPassword(bin2hex(random_bytes(16)));
                $u->setConsentDataRetention(false);
                $anonymizedGuestsCount++;
            }
        }

        // 3. Anonymisation des Propriétaires Expirés
        foreach ($data['expiredOwners'] as $ownerData) {
            $u = $this->userRepo->find($ownerData['id']);
            if ($u) {
                $id = $u->getId();
                $u->setEmail("anonyme_proprio_" . $id . "@loasis.com");
                $u->setFirstname("Anonyme");
                $u->setLastname("Propriétaire");
                $u->setMobile(null);
                $u->setIsOwner(false);
                $u->setIsActive(false);
                $u->setPassword(bin2hex(random_bytes(16)));

                // Libérer ses parcelles
                foreach ($u->getProducts() as $prod) {
                    $u->removeProduct($prod);
                }

                $anonymizedOwnersCount++;
            }
        }

        $this->em->flush();

        return $this->json([
            'message' => 'Nettoyage RGPD exécuté avec succès.',
            'purgedInvoices' => $purgedInvoicesCount,
            'anonymizedGuests' => $anonymizedGuestsCount,
            'anonymizedOwners' => $anonymizedOwnersCount
        ]);
    }
}

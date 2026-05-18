<?php

namespace App\Controller;

use App\Entity\Reservation;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

class ManageBookingController extends AbstractController
{
    // 👇 CORRECTION : Ajout de /api/ dans la route
    #[Route('/api/manage-booking/{id}', name: 'api_manage_booking', methods: ['GET'])]
    public function getBooking(Reservation $reservation, Request $request): JsonResponse
    {
        $token = $request->query->get('token');

        if (!$token || $reservation->getManagementToken() !== $token) {
            return $this->json(['message' => 'Accès refusé ou lien expiré.'], 403);
        }

        $productTitles = [];
        foreach ($reservation->getProducts() as $product) {
            $productTitles[] = $product->getTitle();
        }

        return $this->json([
            'id' => $reservation->getId(),
            'startDate' => $reservation->getStartDate()->format('d/m/Y'),
            'endDate' => $reservation->getEndDate()->format('d/m/Y'),
            'nbAdult' => $reservation->getNbAdult(),
            'nbChildren' => $reservation->getNbChildren(),
            'isPaid' => $reservation->getIsPaid(),
            'products' => $productTitles,
            'invoicePath' => $reservation->getInvoice() ? $reservation->getInvoice()->getPath() : null,
            'user' => [
                'firstname' => $reservation->getUser()->getFirstname(),
                'lastname' => $reservation->getUser()->getLastname(),
            ],
            'poolDays' => $reservation->getPoolDays()
        ]);
    }

    #[Route('/api/manage-booking/{id}/cancel', name: 'api_manage_booking_cancel', methods: ['DELETE'])]
    public function cancelBooking(
        Reservation $reservation,
        Request $request,
        EntityManagerInterface $em,
        \Symfony\Component\Mailer\MailerInterface $mailer,
        \Twig\Environment $twig,
        \App\Service\PdfService $pdfService,
        \Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface $params
    ): JsonResponse {
        $token = $request->query->get('token');
        $isUserAuth = $this->getUser() !== null;
        
        if (!$isUserAuth && (!$token || $reservation->getManagementToken() !== $token)) {
            return $this->json(['message' => 'Accès refusé ou lien expiré.'], 403);
        }

        $user = $reservation->getUser();
        $originalInvoice = $reservation->getInvoice();

        // 1. Création de l'Avoir si payé et possèdant une facture d'origine
        if ($reservation->getIsPaid() && $user && $originalInvoice) {
            $avoir = new \App\Entity\Invoice();
            $avoir->setTitle('AV-CANCEL-' . $reservation->getId() . '-' . date('Ymd'));
            $avoir->setPerson($user->getFirstname() . ' ' . $user->getLastname());
            $avoir->setCreatedAt(new \DateTime());
            $avoir->setPath('generation_en_attente');

            $em->persist($avoir);

            // On clone les lignes en négatif
            foreach ($originalInvoice->getLineInvoices() as $origLine) {
                $line = new \App\Entity\LineInvoice();
                $line->setLineProduct('Remboursement : ' . $origLine->getLineProduct());
                $line->setLinePrice(-$origLine->getLinePrice());
                $avoir->addLineInvoice($line);
                $em->persist($line);
            }

            $em->flush();

            // 2. Génération PDF Avoir
            try {
                $html = $twig->render('invoice/pdf.html.twig', [
                    'invoice' => $avoir,
                    'reservation' => $reservation
                ]);
                $filename = $avoir->getTitle() . '.pdf';
                $pdfPathRelative = $pdfService->generateAndSavePdf($html, $filename);
                $avoir->setPath($pdfPathRelative);
                $em->flush();

                // 3. Envoi du mail d'annulation avec l'avoir en PJ
                $pdfAbsolutePath = $params->get('kernel.project_dir') . '/public' . $pdfPathRelative;
                
                $email = (new \Symfony\Component\Mime\Email())
                    ->from('contact@loasis.com')
                    ->to($user->getEmail())
                    ->subject('Confirmation d\'annulation de votre séjour - Domaine L\'Oasis 🏕️')
                    ->html($twig->render('emails/cancellation_confirmation.html.twig', [
                        'user' => $user,
                        'reservation' => $reservation,
                        'avoir' => $avoir
                    ]))
                    ->attachFromPath($pdfAbsolutePath);

                $mailer->send($email);

            } catch (\Exception $e) {
                // On continue la suppression de la réservation même en cas de souci d'envoi de mail
            }
        }

        // Dissociation de la facture d'origine pour éviter les violations de clé étrangère
        if ($originalInvoice) {
            $reservation->setInvoice(null);
        }

        $em->remove($reservation);
        $em->flush();

        return $this->json(['message' => 'Réservation annulée avec succès.'], 200);
    }

    // 👇 CORRECTION : Ajout de /api/ dans la route
    #[Route('/api/manage-booking/{id}/add-pool', name: 'api_manage_booking_add_pool', methods: ['POST'])]
    public function addPoolOption(
        Reservation $reservation,
        Request $request,
        EntityManagerInterface $em,
        \App\Repository\ProductRepository $productRepo
    ): JsonResponse {
        $token = $request->query->get('token');
        if (!$token || $reservation->getManagementToken() !== $token) {
            return $this->json(['message' => 'Accès refusé ou lien expiré.'], 403);
        }

        $data = json_decode($request->getContent(), true);
        $poolDays = $data['poolDays'] ?? 1;

        $poolAdult = $productRepo->findOneBy(['title' => 'Accès piscine Adulte']);
        $poolChild = $productRepo->findOneBy(['title' => 'Accès piscine Enfant']);
        $added = false;

        if ($poolAdult && $reservation->getNbAdult() > 0) {
            $reservation->addProduct($poolAdult);
            $added = true;
        }
        if ($poolChild && $reservation->getNbChildren() > 0) {
            $reservation->addProduct($poolChild);
            $added = true;
        }

        if ($added) {
            $reservation->setPoolDays($poolDays);
            $em->flush();
            return $this->json(['message' => "Option Espace Aquatique ajoutée pour $poolDays jour(s)."], 200);
        }

        return $this->json(['message' => 'Impossible de trouver l\'option.'], 404);
    }
}

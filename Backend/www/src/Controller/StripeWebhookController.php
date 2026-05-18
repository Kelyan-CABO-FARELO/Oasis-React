<?php

namespace App\Controller;

use App\Repository\ReservationRepository;
use App\Repository\InvoiceRepository;
use App\Repository\UserRepository; // 👈 Ajouté
use App\Service\PdfService;
use Doctrine\ORM\EntityManagerInterface;
use Stripe\Webhook;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\Mime\Address;
use Twig\Environment;

class StripeWebhookController extends AbstractController
{
    #[Route('/webhook/stripe', name: 'stripe_webhook', methods: ['POST'])]
    public function handle(
        Request $request,
        ReservationRepository $reservationRepo,
        InvoiceRepository $invoiceRepo,
        UserRepository $userRepo, // 👈 Ajouté
        PdfService $pdfService,
        Environment $twig,
        EntityManagerInterface $em,
        MailerInterface $mailer
    ): Response {
        $endpointSecret = $_ENV['STRIPE_WEBHOOK_SECRET'] ?? '';
        $payload = $request->getContent();
        $sigHeader = $request->headers->get('stripe-signature');

        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $endpointSecret);
        } catch (\Exception $e) {
            return new Response('Erreur de signature', 400);
        }

        if ($event->type === 'payment_intent.succeeded') {
            try {
                $paymentIntent = $event->data->object;

                // On vérifie le type de paiement (par défaut "reservation")
                $type = $paymentIntent->metadata->type ?? 'reservation';
                $invoiceId = $paymentIntent->metadata->invoice_id ?? null;

                // ==========================================
                // SCÉNARIO 1 : RÉSERVATION CLASSIQUE
                // ==========================================
                if ($type === 'reservation' || $type === 'guest_checkout') {
                    $reservationId = $paymentIntent->metadata->reservation_id ?? null;

                    if ($reservationId) {
                        $reservation = $reservationRepo->find($reservationId);
                        if ($reservation) {
                            $reservation->setIsPaid(true);
                            $fullPdfPath = null;

                            if ($invoiceId) {
                                $invoice = $invoiceRepo->find($invoiceId);
                                if ($invoice) {
                                    $html = $twig->render('invoice/pdf.html.twig', [
                                        'invoice' => $invoice,
                                        'reservation' => $reservation
                                    ]);
                                    $filename = $invoice->getTitle() . '.pdf';
                                    $pdfPathRelative = $pdfService->generateAndSavePdf($html, $filename);
                                    $invoice->setPath($pdfPathRelative);
                                    $fullPdfPath = __DIR__ . '/../../public' . $pdfPathRelative;
                                }
                            }
                            $em->flush();

                            $email = (new TemplatedEmail())
                                ->from(new Address('contact@loasis.com', 'Domaine L\'Oasis'))
                                ->to($reservation->getUser()->getEmail())
                                ->subject('Confirmation de votre séjour n°' . $reservation->getId())
                                ->htmlTemplate('emails/confirmation.html.twig')
                                ->context(['reservation' => $reservation, 'user' => $reservation->getUser()]);

                            if ($fullPdfPath && file_exists($fullPdfPath)) {
                                $email->attachFromPath($fullPdfPath, 'Facture_' . $reservation->getId() . '.pdf', 'application/pdf');
                            }
                            $mailer->send($email);
                        }
                    }
                }
                // ==========================================
                // SCÉNARIO 2 : ACHAT PROPRIÉTAIRE (NOUVEAU)
                // ==========================================
                elseif ($type === 'owner_purchase') {
                    $userId = $paymentIntent->metadata->user_id ?? null;

                    if ($userId && $invoiceId) {
                        $user = $userRepo->find($userId);
                        $invoice = $invoiceRepo->find($invoiceId);

                        if ($user && $invoice) {
                            $fullPdfPath = null;

                            // Génération du PDF
                            $html = $twig->render('invoice/pdf.html.twig', [
                                'invoice' => $invoice,
                                'reservation' => null // 👈 Pas de réservation pour un achat de bien
                            ]);

                            $filename = $invoice->getTitle() . '.pdf';
                            $pdfPathRelative = $pdfService->generateAndSavePdf($html, $filename);
                            $invoice->setPath($pdfPathRelative);
                            $fullPdfPath = __DIR__ . '/../../public' . $pdfPathRelative;

                            $em->flush();

                            // Envoi de l'email de bienvenue
                            $email = (new TemplatedEmail())
                                ->from(new Address('contact@loasis.com', 'Domaine L\'Oasis'))
                                ->to($user->getEmail())
                                ->subject('Félicitations ! Vous êtes propriétaire au Domaine L\'Oasis 🏕️')
                                ->htmlTemplate('emails/owner_welcome.html.twig') // 👈 Le mail spécial propriétaire
                                ->context(['user' => $user, 'invoice' => $invoice]);

                            if ($fullPdfPath && file_exists($fullPdfPath)) {
                                $email->attachFromPath($fullPdfPath, 'Facture_Achat_' . $invoice->getTitle() . '.pdf', 'application/pdf');
                            }
                            $mailer->send($email);
                        }
                    }
                }

            } catch (\Throwable $e) {
                file_put_contents(__DIR__ . '/../../erreur_stripe.txt', $e->getMessage() . " Ligne: " . $e->getLine());
                return new Response('Erreur interne interceptée', 500);
            }
        }

        return new Response('Webhook traité avec succès', 200);
    }
}

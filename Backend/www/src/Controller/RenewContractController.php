<?php

namespace App\Controller;

use App\Entity\Product;
use App\Entity\Invoice;
use App\Entity\LineInvoice;
use Doctrine\ORM\EntityManagerInterface;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use App\Entity\User;

class RenewContractController extends AbstractController
{
    #[Route('/api/products/{id}/renew-contract', name: 'api_renew_contract', methods: ['POST'])]
    public function __invoke(
        Product $product,
        Request $request,
        EntityManagerInterface $em,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if (!$user) {
            return $this->json(['message' => 'Non authentifié.'], 401);
        }

        // Vérification de la propriété du bien
        if (!$product->getUser()->contains($user)) {
            return $this->json(['message' => 'Ce bien ne vous appartient pas.'], 403);
        }

        $data = json_decode($request->getContent(), true);
        $duration = (int) ($data['duration'] ?? 1);

        if ($duration !== 1 && $duration !== 2) {
            return $this->json(['message' => 'Durée invalide (1 ou 2 saisons uniquement).'], 400);
        }

        // Tarifs de renouvellement : 1 saison = 500 €, 2 saisons = 900 €
        $amountInEuros = $duration === 1 ? 500 : 900;

        // 1. Pré-génération de la facture
        $invoice = new Invoice();
        $invoice->setTitle('FA-RENEW-' . date('Ymd') . '-' . random_int(1000, 9999));
        $invoice->setPerson($user->getFirstname() . ' ' . $user->getLastname());
        $invoice->setCreatedAt(new \DateTime());
        $invoice->setPath('generation_en_attente');

        $line = new LineInvoice();
        $line->setLineProduct('Renouvellement Contrat (' . $duration . ' Saison(s)) : ' . $product->getTitle());
        $line->setLinePrice($amountInEuros * 100); // En centimes
        $invoice->addLineInvoice($line);

        $em->persist($line);
        $em->persist($invoice);
        $em->flush();

        // 2. Préparation Stripe
        Stripe::setApiKey(trim($_ENV['STRIPE_SECRET_KEY']));

        try {
            $paymentIntent = PaymentIntent::create([
                'amount' => $amountInEuros * 100,
                'currency' => 'eur',
                'automatic_payment_methods' => ['enabled' => true],
                'metadata' => [
                    'user_id' => $user->getId(),
                    'product_id' => $product->getId(),
                    'invoice_id' => $invoice->getId(),
                    'type' => 'contract_renewal',
                    'duration' => $duration
                ],
            ]);

            return $this->json([
                'clientSecret' => $paymentIntent->client_secret,
                'amount' => $amountInEuros,
                'message' => 'Prêt pour le paiement'
            ], 200);

        } catch (\Exception $e) {
            return $this->json(['message' => $e->getMessage()], 500);
        }
    }
}

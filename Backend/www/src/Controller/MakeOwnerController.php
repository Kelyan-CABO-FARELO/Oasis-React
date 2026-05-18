<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\Invoice;
use App\Entity\LineInvoice;
use App\Repository\ProductRepository;
use Doctrine\ORM\EntityManagerInterface;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

class MakeOwnerController extends AbstractController
{
    #[Route('/api/users/{id}/make-owner', name: 'api_make_owner', methods: ['POST'])]
    public function __invoke(
        User $user,
        Request $request,
        EntityManagerInterface $em,
        ProductRepository $productRepo
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        $amountInEuros = (int) ($data['amount'] ?? 0);
        $productId = $data['productId'] ?? null;

        if ($amountInEuros <= 0 || !$productId) {
            return $this->json(['message' => 'Montant ou produit invalide.'], 400);
        }

        $product = $productRepo->find($productId);
        if (!$product) {
            return $this->json(['message' => 'Ce bien n\'existe pas.'], 404);
        }

        // 🛡️ VERROU : On vérifie si le bien n'est pas déjà vendu ET que son contrat n'est pas expiré
        foreach ($product->getUser() as $existingUser) {
            if ($existingUser->isOwner()) {
                $contractStart = $product->getContractDate();
                if ($contractStart) {
                    $contractEnd = new \DateTime($contractStart->format('Y') . '-10-10');
                    if ($contractStart > $contractEnd) {
                        $contractEnd->modify('+1 year');
                    }
                    $duration = $product->getDuration() ?? 1;
                    if ($duration > 1) {
                        $yearsToAdd = $duration - 1;
                        $contractEnd->modify("+$yearsToAdd years");
                    }
                    
                    if (new \DateTime() <= $contractEnd) {
                        return $this->json([
                            'message' => 'Ce bien est déjà sous contrat actif avec ' . $existingUser->getFirstname() . ' ' . $existingUser->getLastname()
                        ], 403);
                    } else {
                        // Le contrat est expiré, on dissocie l'ancien propriétaire pour qu'il n'y ait pas multipropriété
                        $existingUser->removeProduct($product);
                        $em->persist($existingUser);
                    }
                } else {
                    // Si pas de contrat défini sur le produit mais associé à un proprio
                    return $this->json([
                        'message' => 'Ce bien est déjà la propriété de ' . $existingUser->getFirstname() . ' ' . $existingUser->getLastname()
                    ], 403);
                }
            }
        }

        // ==========================================
        // 1. TRANSFORMATION EN PROPRIÉTAIRE
        // ==========================================
        $user->setWantsToBecomeOwner(false); // On enlève l'étiquette prospect

        if (!$user->isOwner()) {
            $user->setIsOwner(true);
            
            // Fusion des rôles (pour ne pas écraser les droits Admin s'il y en a)
            $roles = $user->getRoles();
            $roles[] = 'ROLE_OWNER';
            $user->setRoles(array_unique($roles));

            // 🔑 GÉNÉRATION DU LIEN MAGIQUE
            // On génère le jeton qui sera glissé dans l'e-mail pour la création du mot de passe
            $user->setResetToken(bin2hex(random_bytes(32)));
        }

        $duration = (int) ($data['duration'] ?? 1);

        // Date de début de contrat et liaison du bien
        $user->setContractDate(new \DateTime());
        $user->addProduct($product);

        // Configuration du contrat spécifique au produit
        $product->setContractDate(new \DateTime());
        $product->setDuration($duration);

        // ==========================================
        // 2. GÉNÉRATION DE LA FACTURE D'ACHAT
        // ==========================================
        $invoice = new Invoice();
        $invoice->setTitle('FA-' . date('Ymd') . '-' . random_int(1000, 9999));
        $invoice->setPerson($user->getFirstname() . ' ' . $user->getLastname());
        $invoice->setCreatedAt(new \DateTime());
        $invoice->setPath('generation_en_attente');

        $line = new LineInvoice();
        $line->setLineProduct('Achat Résidence/Parcelle : ' . $product->getTitle());
        $line->setLinePrice($amountInEuros * 100); // En centimes pour Stripe
        $invoice->addLineInvoice($line);

        $em->persist($line);
        $em->persist($invoice);

        // 💾 SAUVEGARDE GLOBALE
        // Ici, Symfony enregistre en base : la facture, les nouveaux rôles, ET le ResetToken !
        $em->flush();

        // ==========================================
        // 3. PRÉPARATION DU PAIEMENT STRIPE
        // ==========================================
        Stripe::setApiKey(trim($_ENV['STRIPE_SECRET_KEY']));

        try {
            $paymentIntent = PaymentIntent::create([
                'amount' => $amountInEuros * 100,
                'currency' => 'eur',
                'automatic_payment_methods' => ['enabled' => true],
                'metadata' => [
                    'user_id' => $user->getId(),
                    'invoice_id' => $invoice->getId(),
                    'type' => 'owner_purchase' // Permettra au webhook de différencier l'achat de la location
                ],
            ]);

            return $this->json([
                'clientSecret' => $paymentIntent->client_secret,
                'message' => 'Prêt pour le paiement'
            ], 200);

        } catch (\Exception $e) {
            return $this->json(['message' => $e->getMessage()], 500);
        }
    }
}

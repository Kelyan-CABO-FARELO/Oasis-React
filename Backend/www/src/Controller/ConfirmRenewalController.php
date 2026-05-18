<?php

namespace App\Controller;

use App\Entity\Product;
use App\Entity\User;
use App\Message\ProcessOwnerSaleMessage;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

class ConfirmRenewalController extends AbstractController
{
    #[Route('/api/products/{id}/confirm-renewal', name: 'api_confirm_renewal', methods: ['POST'])]
    public function __invoke(
        Product $product,
        Request $request,
        EntityManagerInterface $em,
        MessageBusInterface $bus,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if (!$user) {
            return $this->json(['message' => 'Non authentifié.'], 401);
        }

        // Vérification de la propriété
        if (!$product->getUser()->contains($user)) {
            return $this->json(['message' => 'Ce bien ne vous appartient pas.'], 403);
        }

        $data = json_decode($request->getContent(), true);
        $newDuration = (int) ($data['duration'] ?? 1);

        if ($newDuration !== 1 && $newDuration !== 2) {
            return $this->json(['message' => 'Durée de renouvellement invalide.'], 400);
        }

        $today = new \DateTime();
        
        // Calculer si le contrat actuel sur le produit est expiré ou inexistant
        $isExpired = true;
        if ($product->getContractDate()) {
            $start = $product->getContractDate();
            $durationSeasons = $product->getDuration() ?? 1;
            
            // Calcul de la date d'expiration actuelle
            $end = new \DateTime($start->format('Y-10-10'));
            if ($start > $end) {
                $end->modify('+1 year');
            }
            if ($durationSeasons > 1) {
                $yearsToAdd = $durationSeasons - 1;
                $end->modify("+$yearsToAdd years");
            }
            
            if ($today < $end) {
                $isExpired = false;
            }
        }

        if ($isExpired) {
            // Si expiré ou inexistant, on repart sur un nouveau contrat à partir d'aujourd'hui
            $product->setContractDate($today);
            $product->setDuration($newDuration);
        } else {
            // Si toujours en cours, on prolonge simplement la durée (nombre de saisons)
            $product->setDuration(($product->getDuration() ?? 1) + $newDuration);
        }

        // Sauvegarde
        $em->flush();

        // On lance la génération du PDF et de l'email en arrière-plan via Messenger
        $bus->dispatch(new ProcessOwnerSaleMessage($user->getId()));

        return $this->json([
            'message' => 'Contrat renouvelé avec succès ! Facture en cours de génération.',
            'contractDate' => $product->getContractDate() ? $product->getContractDate()->format(\DateTime::ATOM) : null,
            'duration' => $product->getDuration()
        ], 200);
    }
}

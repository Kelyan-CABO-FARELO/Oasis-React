<?php
// src/Controller/ConfirmOwnerSaleController.php
namespace App\Controller;

use App\Entity\User;
use App\Message\ProcessOwnerSaleMessage;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Routing\Attribute\Route;

class ConfirmOwnerSaleController extends AbstractController
{
    #[Route('/api/users/{id}/confirm-sale', name: 'api_confirm_sale', methods: ['POST'])]
    public function __invoke(User $user, MessageBusInterface $bus): JsonResponse
    {
        // On poste la "lettre" dans la boîte aux lettres de Symfony Messenger
        $bus->dispatch(new ProcessOwnerSaleMessage($user->getId()));

        // On répond IMMÉDIATEMENT à React en 0.01 seconde !
        return $this->json(['message' => 'Paiement validé, paperasse en arrière-plan !'], 200);
    }
}

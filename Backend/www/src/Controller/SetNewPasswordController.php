<?php

namespace App\Controller;

use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

class SetNewPasswordController extends AbstractController
{
    #[Route('/api/set-new-password', name: 'api_set_new_password', methods: ['POST'])]
    public function __invoke(
        Request $request,
        UserRepository $userRepo,
        UserPasswordHasherInterface $passwordHasher,
        EntityManagerInterface $em
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        $token = $data['token'] ?? null;
        $plainPassword = $data['password'] ?? null;

        if (!$token || !$plainPassword) {
            return $this->json(['message' => 'Token ou mot de passe manquant.'], 400);
        }

        if (strlen($plainPassword) < 6) {
            return $this->json(['message' => 'Le mot de passe doit faire au moins 6 caractères.'], 400);
        }

        // 1. On cherche l'utilisateur qui a ce token exact
        $user = $userRepo->findOneBy(['resetToken' => $token]);

        if (!$user) {
            return $this->json(['message' => 'Lien invalide ou expiré.'], 404);
        }

        // 2. On hache le nouveau mot de passe
        $hashedPassword = $passwordHasher->hashPassword($user, $plainPassword);
        $user->setPassword($hashedPassword);

        // 3. On vide le token pour que le lien devienne inutilisable (Sécurité !)
        $user->setResetToken(null);

        // 4. On sauvegarde !
        $em->flush();

        return $this->json(['message' => 'Mot de passe mis à jour avec succès !'], 200);
    }
}

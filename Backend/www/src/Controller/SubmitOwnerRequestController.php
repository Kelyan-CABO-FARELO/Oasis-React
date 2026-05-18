<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class SubmitOwnerRequestController extends AbstractController
{
    #[Route('/api/submit-owner-request', name: 'submit_owner_request', methods: ['POST'])]
    public function __invoke(
        Request $request,
        UserRepository $userRepo,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $hasher
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        $email = $data['email'] ?? null;

        if (!$email) {
            return $this->json(['message' => 'Email manquant'], 400);
        }

        // 1. On cherche si ce client existe déjà dans ta base
        $user = $userRepo->findOneBy(['email' => $email]);

        /// 2. S'il n'existe pas, on le crée en silence
        if (!$user) {
            $user = new User();
            $user->setEmail($email);
            $user->setFirstname($data['firstname'] ?? '');
            $user->setLastname($data['lastname'] ?? '');
            $user->setMobile($data['mobile'] ?? '');
            $user->setIsActive(true);
            $user->setIsOwner(false);

            // 👇 AJOUTE CES DEUX LIGNES ICI 👇
            $user->setCreatedAt(new \DateTime());
            $user->setUpdatedAt(new \DateTime());

            // Mot de passe aléatoire sécurisé
            $user->setPassword($hasher->hashPassword($user, bin2hex(random_bytes(10))));
            $em->persist($user);
        }

        // 3. DANS TOUS LES CAS (Nouveau ou Ancien client), on lui met l'étiquette de prospect
        $user->setWantsToBecomeOwner(true);
        $em->flush();

        return $this->json(['message' => 'Demande prise en compte'], 200);
    }
}

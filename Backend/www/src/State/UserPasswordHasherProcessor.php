<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\User;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class UserPasswordHasherProcessor implements ProcessorInterface
{
    public function __construct(
        // On récupère le processeur par défaut de Doctrine (qui sauvegarde en base)
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private ProcessorInterface $processor,
        // On récupère l'outil de hashage de Symfony
        private UserPasswordHasherInterface $passwordHasher
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        // On vérifie que la donnée envoyée est bien un Utilisateur et qu'il a un mot de passe
        if ($data instanceof User && $data->getPassword()) {
            // On hash le mot de passe
            $hashedPassword = $this->passwordHasher->hashPassword(
                $data,
                $data->getPassword()
            );

            // On remplace le mot de passe en clair par le mot de passe hashé
            $data->setPassword($hashedPassword);
        }

        // On passe le relais à Doctrine pour sauvegarder l'utilisateur en base de données
        return $this->processor->process($data, $operation, $uriVariables, $context);
    }
}

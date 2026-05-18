<?php

namespace App\DataFixtures;

use App\Entity\Media;
use App\Entity\Price;
use App\Entity\Product;
use App\Entity\Reservation;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    public function __construct(private UserPasswordHasherInterface $passwordHasher)
    {
    }

    public function load(ObjectManager $manager): void
    {
        // 1. Liste des noms et prénoms humoristiques en français
        $funnyNames = [
            ['firstname' => 'Jean', 'lastname' => 'Bon'],
            ['firstname' => 'Sarah', 'lastname' => 'Vigote'],
            ['firstname' => 'Thérèse', 'lastname' => 'Ponsable'],
            ['firstname' => 'Mellie', 'lastname' => 'Solo'],
            ['firstname' => 'Gaston', 'lastname' => 'Flop'],
            ['firstname' => 'Terry', 'lastname' => 'Golo'],
            ['firstname' => 'Daisy', 'lastname' => 'Drate'],
            ['firstname' => 'Gilles', 'lastname' => 'Pareil'],
            ['firstname' => 'Ella', 'lastname' => 'Lairbon'],
            ['firstname' => 'Elvire', 'lastname' => 'Volte'],
            ['firstname' => 'Justin', 'lastname' => 'Ptitpeu'],
            ['firstname' => 'Cécile', 'lastname' => 'Facile'],
            ['firstname' => 'Pierre', 'lastname' => 'Kiroule'],
            ['firstname' => 'Sandra', 'lastname' => 'Dechoux'],
            ['firstname' => 'Yves', 'lastname' => 'Remords'],
            ['firstname' => 'Aude', 'lastname' => 'Javel'],
            ['firstname' => 'Marc', 'lastname' => 'Descafes'],
            ['firstname' => 'Guy', 'lastname' => 'Liguili'],
            ['firstname' => 'Alain', 'lastname' => 'Proviste'],
            ['firstname' => 'Gérard', 'lastname' => 'Menvussa'],
            ['firstname' => 'Paul', 'lastname' => 'Emploi'],
            ['firstname' => 'Lucie', 'lastname' => 'Dite'],
            ['firstname' => 'Eddie', 'lastname' => 'Fice'],
            ['firstname' => 'Thibault', 'lastname' => 'Golo'],
            ['firstname' => 'Larry', 'lastname' => 'Bambelle'],
            ['firstname' => 'Kelly', 'lastname' => 'Diote'],
            ['firstname' => 'Anna', 'lastname' => 'Tomie'],
            ['firstname' => 'Ray', 'lastname' => 'Rate'],
            ['firstname' => 'Eva', 'lastname' => 'Nouie'],
            ['firstname' => 'Emma', 'lastname' => 'Tines'],
            ['firstname' => 'Jules', 'lastname' => 'Haperdu'],
            ['firstname' => 'Otto', 'lastname' => 'Graphe'],
            ['firstname' => 'Camille', 'lastname' => 'Onette'],
            ['firstname' => 'Yann', 'lastname' => 'Solo'],
            ['firstname' => 'Elisa', 'lastname' => 'Beth'],
            ['firstname' => 'Omer', 'lastname' => 'Tasser'],
            ['firstname' => 'Mélusine', 'lastname' => 'Enfaillite'],
            ['firstname' => 'Gaspard', 'lastname' => 'Alajettée'],
            ['firstname' => 'Fleur', 'lastname' => 'Bleue'],
            ['firstname' => 'Rose', 'lastname' => 'Bifteck'],
            ['firstname' => 'Pacôme', 'lastname' => 'Dhabitude'],
            ['firstname' => 'Maude', 'lastname' => 'Erne'],
            ['firstname' => 'Eddy', 'lastname' => 'Torial'],
            ['firstname' => 'Sacha', 'lastname' => 'Touille'],
            ['firstname' => 'Harry', 'lastname' => 'Covert'],
            ['firstname' => 'Inès', 'lastname' => 'Péré'],
            ['firstname' => 'Gilles', 'lastname' => 'Paré'],
            ['firstname' => 'Lara', 'lastname' => 'Clette'],
            ['firstname' => 'Aude', 'lastname' => 'Vasselle'],
            ['firstname' => 'Barbie', 'lastname' => 'Turique'],
            ['firstname' => 'Alex', 'lastname' => 'Térieur'],
            ['firstname' => 'Annie', 'lastname' => 'Mateur'],
            ['firstname' => 'Chantal', 'lastname' => 'Gique'],
            ['firstname' => 'Colette', 'lastname' => 'Ralle'],
            ['firstname' => 'Jacques', 'lastname' => 'Ouzi'],
            ['firstname' => 'Léon', 'lastname' => 'Gitude'],
            ['firstname' => 'Marie', 'lastname' => 'Audejavelle'],
            ['firstname' => 'Maud', 'lastname' => 'Este'],
            ['firstname' => 'Thierry', 'lastname' => 'Golo'],
            ['firstname' => 'Yvon', 'lastname' => 'Dormir']
        ];

        shuffle($funnyNames);

        // ==========================================
        // 👑 CRÉATION DE L'ADMINISTRATEUR (ALAIN TERNET)
        // ==========================================
        $admin = new User();
        $admin->setEmail("admin@admin.com");
        $admin->setRoles(["ROLE_ADMIN"]);
        $admin->setPassword($this->passwordHasher->hashPassword($admin, "password"));
        $admin->setFirstname("Alain");
        $admin->setLastname("Ternet");
        $admin->setMobile("0611223344");
        $admin->setCreatedAt(new \DateTime());
        $admin->setUpdatedAt(new \DateTime());
        $admin->setIsActive(true);
        $admin->setIsOwner(false);
        $manager->persist($admin);

        // ==========================================
        // 🏡 CRÉATION DES 30 PROPRIÉTAIRES (OWNERS)
        // ==========================================
        $owners = [];
        for ($o = 0; $o < 30; $o++) {
            $namePair = array_pop($funnyNames);
            $owner = new User();
            $owner->setEmail(strtolower($namePair['firstname']) . '.' . strtolower($namePair['lastname']) . '@loasis-proprio.fr');
            $owner->setRoles(["ROLE_OWNER"]);
            $owner->setPassword($this->passwordHasher->hashPassword($owner, "password"));
            $owner->setFirstname($namePair['firstname']);
            $owner->setLastname($namePair['lastname']);
            $owner->setMobile("06" . random_int(10000000, 99999999));
            
            // Date de contrat entre aujourd'hui et il y a 300 jours
            $contractDate = new \DateTime('-' . random_int(10, 300) . ' days');
            $owner->setContractDate($contractDate);
            $owner->setIsActive(true);
            $owner->setIsOwner(true);
            $owner->setCreatedAt(new \DateTime());
            $owner->setUpdatedAt(new \DateTime());

            $manager->persist($owner);
            $owners[] = $owner;
        }

        // ==========================================
        // 🏕️ CRÉATION DES LOCATAIRES (GUESTS)
        // ==========================================
        $guests = [];
        for ($g = 0; $g < 20; $g++) {
            $namePair = array_pop($funnyNames);
            $guest = new User();
            $guest->setEmail(strtolower($namePair['firstname']) . '.' . strtolower($namePair['lastname']) . '@gmail.com');
            $guest->setRoles(["ROLE_USER"]);
            $guest->setPassword($this->passwordHasher->hashPassword($guest, "password"));
            $guest->setFirstname($namePair['firstname']);
            $guest->setLastname($namePair['lastname']);
            $guest->setMobile("07" . random_int(10000000, 99999999));
            $guest->setIsActive(true);
            $guest->setIsOwner(false);
            $guest->setCreatedAt(new \DateTime());
            $guest->setUpdatedAt(new \DateTime());

            $manager->persist($guest);
            $guests[] = $guest;
        }

        // ==========================================
        // 📦 DÉFINITION DES BIENS (PRODUCTS)
        // ==========================================
        $productsList = [];
        $globalIndex = 1;

        $createSpecificProduct = function($title, $basePrice, $imageName) use ($manager, $owners, &$productsList, &$globalIndex) {
            $product = new Product();
            $product->setTitle($title . ' n°' . $globalIndex);
            $product->setDescription("Superbe résidence premium idéalement située au Domaine L'Oasis pour profiter de la nature et de nos piscines.");

            // Prix
            $price = new Price();
            $price->setPrice($basePrice);
            $product->addPrice($price);
            $manager->persist($price);

            // Image
            $media = new Media();
            $media->setPath($imageName);
            $product->addMedium($media);
            $manager->persist($media);

            // Attribution Propriétaire (75% des biens appartiennent à l'un des 30 propriétaires)
            if (random_int(1, 10) <= 7.5) {
                $randomOwner = $owners[array_rand($owners)];
                $product->addUser($randomOwner);
                $product->setContractDate($randomOwner->getContractDate());
                $product->setDuration(random_int(1, 2));
            }

            $manager->persist($product);
            $productsList[] = $product;
            $globalIndex++;
        };

        // Mobil-Homes (Valeurs héritées des fixtures originales)
        for ($i = 0; $i < 14; $i++) $createSpecificProduct('MobileHome 3 personnes', 2000, 'mh-3.png');
        for ($i = 0; $i < 13; $i++) $createSpecificProduct('MobileHome 4 personnes', 2400, 'mh-4.png');
        for ($i = 0; $i < 17; $i++) $createSpecificProduct('MobileHome 5 personnes', 2700, 'mh-5.png');
        for ($i = 0; $i < 6; $i++)  $createSpecificProduct('MobileHome 6-8 personnes', 3400, 'mh-68.png');

        // Caravanes
        for ($i = 0; $i < 5; $i++) $createSpecificProduct('Caravane 6 places', 2400, 'c-6.png');
        for ($i = 0; $i < 2; $i++) $createSpecificProduct('Caravane 4 places', 1800, 'c-4.png');
        for ($i = 0; $i < 3; $i++) $createSpecificProduct('Caravane 2 places', 1500, 'c-2.png');

        // Emplacements
        for ($i = 0; $i < 19; $i++) $createSpecificProduct('Emplacement 8 m²', 1200, 'e-8.png');
        for ($i = 0; $i < 11; $i++) $createSpecificProduct('Emplacement 12 m²', 1400, 'e-12.png');

        // ==========================================
        // 📅 RÉSERVATIONS COHÉRENTES LIÉES À DES USERS
        // ==========================================
        $currentYear = (new \DateTime())->format('Y');

        foreach ($productsList as $product) {
            // Entre 0 et 3 réservations par produit
            $nbReservations = random_int(0, 3);
            for ($r = 0; $r < $nbReservations; $r++) {
                $reservation = new Reservation();
                
                // Dates pendant la saison d'ouverture (05 Mai au 10 Octobre)
                $month = random_int(5, 9);
                $day = random_int(1, 28);
                
                $startDate = new \DateTime("$currentYear-$month-$day");
                $endDate = (clone $startDate)->modify('+' . random_int(2, 14) . ' days');

                $reservation->setStartDate($startDate);
                $reservation->setEndDate($endDate);
                $reservation->addProduct($product);
                $reservation->setNbAdult(random_int(1, 4));
                $reservation->setNbChildren(random_int(0, 3));
                $reservation->setIsPaid(true);

                // Associe à un locataire de nos locataires drôles !
                $randomGuest = $guests[array_rand($guests)];
                $reservation->setUser($randomGuest);

                // Clé d'annulation sécurisée
                $reservation->setManagementToken(bin2hex(random_bytes(16)));

                $manager->persist($reservation);
            }

            // Génération optionnelle de réservations pour la saison passée (2025)
            // uniquement si le contrat a démarré en 2025
            $productContractDate = $product->getContractDate();
            if ($productContractDate && (int)$productContractDate->format('Y') === 2025) {
                $nbReservations2025 = random_int(1, 2);
                for ($r25 = 0; $r25 < $nbReservations2025; $r25++) {
                    $reservation25 = new Reservation();
                    
                    $month = random_int(5, 9);
                    $day = random_int(1, 28);
                    
                    $startDate = new \DateTime("2025-$month-$day");
                    $endDate = (clone $startDate)->modify('+' . random_int(3, 10) . ' days');

                    $reservation25->setStartDate($startDate);
                    $reservation25->setEndDate($endDate);
                    $reservation25->addProduct($product);
                    $reservation25->setNbAdult(random_int(1, 4));
                    $reservation25->setNbChildren(random_int(0, 3));
                    $reservation25->setIsPaid(true);

                    $randomGuest = $guests[array_rand($guests)];
                    $reservation25->setUser($randomGuest);
                    $reservation25->setManagementToken(bin2hex(random_bytes(16)));

                    $manager->persist($reservation25);
                }
            }
        }

        // ==========================================
        // ➕ CRÉATION DES EXTRAS
        // ==========================================
        $createExtra = function($title, $priceValue, $desc, $imageName = null, $duration = null) use ($manager) {
            $extra = new Product();
            $extra->setTitle($title);
            $extra->setDescription($desc);

            if ($duration !== null) {
                $extra->setDuration($duration);
            }

            $price = new Price();
            $price->setPrice($priceValue);
            $extra->addPrice($price);
            $manager->persist($price);

            if ($imageName !== null) {
                $media = new Media();
                $media->setPath($imageName);
                $extra->addMedium($media);
                $manager->persist($media);
            }

            $manager->persist($extra);
        };

        $createExtra('Taxe de séjour Adulte', 60, 'Taxe de séjour par nuitée et par adulte.', null, 1);
        $createExtra('Taxe de séjour Enfant', 35, 'Taxe de séjour par nuitée et par enfant.', null, 1);
        $createExtra('Accès piscine Adulte', 150, 'Accès d\'un jour à l\'espace aquatique.', 'pool-adults.png', 1);
        $createExtra('Accès piscine Enfant', 100, 'Accès d\'un jour à l\'espace aquatique.', 'pool-kids.png', 1);

        $manager->flush();
    }
}

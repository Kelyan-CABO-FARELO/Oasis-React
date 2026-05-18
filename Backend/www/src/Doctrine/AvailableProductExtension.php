<?php

namespace App\Doctrine;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Entity\Product;
use Doctrine\ORM\QueryBuilder;
use Symfony\Component\HttpFoundation\RequestStack;

class AvailableProductExtension implements QueryCollectionExtensionInterface
{
    public function __construct(private RequestStack $requestStack) {}

    public function applyToCollection(
        QueryBuilder $queryBuilder,
        QueryNameGeneratorInterface $queryNameGenerator,
        string $resourceClass,
        Operation $operation = null,
        array $context = []
    ): void {
        if (Product::class !== $resourceClass) {
            return;
        }

        $request = $this->requestStack->getCurrentRequest();
        if (!$request) {
            return;
        }

        $startDate = $request->query->get('startDate');
        $endDate = $request->query->get('endDate');

        if ($startDate && $endDate) {
            // 🛑 CORRECTION : On convertit le texte en vraies Dates !
            try {
                $start = new \DateTime($startDate);
                $end = new \DateTime($endDate);
            } catch (\Exception $e) {
                return; // Si la date est mal formatée, on annule
            }

            $rootAlias = $queryBuilder->getRootAliases()[0];

            $subQuery = $queryBuilder->getEntityManager()->createQueryBuilder()
                ->select('p.id')
                ->from('App\Entity\Reservation', 'r')
                ->join('r.products', 'p')
                ->where('r.startDate < :endDate')
                ->andWhere('r.endDate > :startDate')
                ->andWhere('r.isPaid = true');

            $queryBuilder->andWhere($queryBuilder->expr()->notIn($rootAlias . '.id', $subQuery->getDQL()))
                ->setParameter('startDate', $start) // On passe l'objet Date
                ->setParameter('endDate', $end);    // On passe l'objet Date
        }
    }
}

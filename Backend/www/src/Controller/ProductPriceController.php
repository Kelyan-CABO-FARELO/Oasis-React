<?php

namespace App\Controller;

use App\Entity\Price;
use App\Repository\ProductRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/admin/product-prices')]
class ProductPriceController extends AbstractController
{
    #[Route('', name: 'app_admin_product_prices_get', methods: ['GET'])]
    public function getPrices(ProductRepository $productRepo): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $products = $productRepo->findAll();
        $types = [];

        foreach ($products as $product) {
            $title = $product->getTitle();
            // Remove " n°X" from the end of the string if it exists
            $type = preg_replace('/ n°\d+$/', '', $title);

            if (!isset($types[$type])) {
                $priceObj = $product->getPrices()->first();
                $types[$type] = [
                    'type' => $type,
                    'price' => $priceObj ? $priceObj->getPrice() : 0,
                    'count' => 1
                ];
            } else {
                $types[$type]['count']++;
            }
        }

        return $this->json(array_values($types));
    }

    #[Route('', name: 'app_admin_product_prices_put', methods: ['PUT'])]
    public function updatePrice(Request $request, ProductRepository $productRepo, EntityManagerInterface $em): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $data = json_decode($request->getContent(), true);
        if (!isset($data['type']) || !isset($data['newPrice'])) {
            return $this->json(['message' => 'Données incomplètes (type et newPrice requis).'], 400);
        }

        $type = $data['type'];
        $newPrice = (int) $data['newPrice'];

        $products = $productRepo->findAll();
        $updatedCount = 0;

        foreach ($products as $product) {
            $title = $product->getTitle();
            $productType = preg_replace('/ n°\d+$/', '', $title);

            if ($productType === $type) {
                $priceObj = $product->getPrices()->first();
                if ($priceObj) {
                    $priceObj->setPrice($newPrice);
                } else {
                    $priceObj = new Price();
                    $priceObj->setPrice($newPrice);
                    $product->addPrice($priceObj);
                    $em->persist($priceObj);
                }
                $updatedCount++;
            }
        }

        $em->flush();

        return $this->json([
            'message' => "Le prix du type '$type' a été mis à jour à " . ($newPrice / 100) . " € pour $updatedCount produit(s)."
        ]);
    }
}

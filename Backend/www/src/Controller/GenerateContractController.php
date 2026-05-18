<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\ProductRepository;
use App\Service\PdfService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Twig\Environment;

class GenerateContractController extends AbstractController
{
    #[Route('/api/users/{id}/generate-contract', name: 'api_generate_contract', methods: ['POST'])]
    public function __invoke(
        User $user,
        Request $request,
        ProductRepository $productRepo,
        PdfService $pdfService,
        Environment $twig
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        $amount = $data['amount'] ?? 0;
        $productId = $data['productId'] ?? null;

        if (!$productId || !$amount) {
            return $this->json(['message' => 'Données incomplètes'], 400);
        }

        $product = $productRepo->find($productId);

        // 1. On génère le HTML avec les données
        $html = $twig->render('contract/pdf.html.twig', [
            'user' => $user,
            'product' => $product,
            'amount' => $amount,
            'date' => new \DateTime()
        ]);

        // 2. On utilise ton PdfService pour créer le fichier
        $filename = 'Contrat_' . $user->getFirstname() . '_' . $user->getLastname() . '_' . date('YmdHis') . '.pdf';
        $pdfPathRelative = $pdfService->generateAndSavePdf($html, $filename);

        // 3. On renvoie l'URL absolue du PDF pour que React l'ouvre dans un nouvel onglet
        return $this->json([
            'pdfUrl' => $request->getSchemeAndHttpHost() . $pdfPathRelative
        ], 200);
    }
}

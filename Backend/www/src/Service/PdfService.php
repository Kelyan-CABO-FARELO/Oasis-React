<?php

namespace App\Service;

use Dompdf\Dompdf;
use Dompdf\Options;

class PdfService
{
    public function generateAndSavePdf(string $html, string $filename): string
    {
        // 1. Configuration de DomPDF
        $pdfOptions = new Options();
        $pdfOptions->set('defaultFont', 'Arial');
        $pdfOptions->set('isRemoteEnabled', true); // Pour autoriser les images/logos

        // 2. Initialisation
        $dompdf = new Dompdf($pdfOptions);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        // 3. Sauvegarde sur le serveur
        $publicDirectory = __DIR__ . '/../../public/uploads/invoices';
        if (!file_exists($publicDirectory)) {
            mkdir($publicDirectory, 0777, true);
        }

        $filePath = $publicDirectory . '/' . $filename;
        file_put_contents($filePath, $dompdf->output());

        // 4. On retourne le chemin relatif pour la BDD
        return '/uploads/invoices/' . $filename;
    }
}

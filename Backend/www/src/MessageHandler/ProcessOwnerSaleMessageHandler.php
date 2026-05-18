<?php
// src/MessageHandler/ProcessOwnerSaleMessageHandler.php
namespace App\MessageHandler;

use App\Message\ProcessOwnerSaleMessage;
use App\Repository\UserRepository;
use App\Repository\InvoiceRepository;
use App\Service\PdfService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Twig\Environment;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;

#[AsMessageHandler]
class ProcessOwnerSaleMessageHandler
{
    public function __construct(
        private UserRepository $userRepo,
        private InvoiceRepository $invoiceRepo,
        private PdfService $pdfService,
        private Environment $twig,
        private MailerInterface $mailer,
        private EntityManagerInterface $em,
        private ParameterBagInterface $params
    ) {}

    public function __invoke(ProcessOwnerSaleMessage $message)
    {
        // On récupère l'utilisateur depuis son ID
        $user = $this->userRepo->find($message->getUserId());
        if (!$user) return;

        // 1. Trouver la facture en attente
        $invoices = $this->invoiceRepo->findBy(
            ['person' => $user->getFirstname() . ' ' . $user->getLastname(), 'path' => 'generation_en_attente'],
            ['createdAt' => 'DESC'],
            1
        );
        $invoice = $invoices[0] ?? null;
        if (!$invoice) return;

        // 2. Générer le PDF
        $html = $this->twig->render('invoice/pdf.html.twig', ['invoice' => $invoice, 'user' => $user]);
        $filename = 'Facture_Acquisition_' . $user->getLastname() . '_' . date('Ymd') . '.pdf';
        $pdfPathRelative = $this->pdfService->generateAndSavePdf($html, $filename);

        $invoice->setPath($pdfPathRelative);
        $this->em->flush();

        // 3. Envoyer l'E-mail
        $pdfAbsolutePath = $this->params->get('kernel.project_dir') . '/public' . $pdfPathRelative;
        $isRenewal = str_starts_with(strtoupper($invoice->getTitle() ?? ''), 'FA-RENEW-');

        $email = (new Email())
            ->from('contact@domaine-loasis.fr')
            ->to($user->getEmail());

        if ($isRenewal) {
            $email->subject('Confirmation de renouvellement de contrat - Domaine L\'Oasis 🔄')
                  ->html($this->twig->render('emails/owner_renewal.html.twig', ['user' => $user, 'invoice' => $invoice]));
        } else {
            $email->subject('Bienvenue chez vous ! Votre facture d\'achat - Domaine L\'Oasis 🏕️')
                  ->html($this->twig->render('emails/owner_welcome.html.twig', ['user' => $user, 'invoice' => $invoice]));
        }

        $email->attachFromPath($pdfAbsolutePath);
        $this->mailer->send($email);
    }
}

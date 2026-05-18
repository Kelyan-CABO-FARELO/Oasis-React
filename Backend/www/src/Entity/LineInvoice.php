<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use App\Repository\LineInvoiceRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups; // 👈 IMPORT LUI AUSSI

#[ApiResource(
    operations: [
        new GetCollection(security: "is_granted('ROLE_ADMIN')"),
        new Get(security: "is_granted('ROLE_ADMIN')"),
        new Post(security: "is_granted('ROLE_ADMIN')"),
        new Put(security: "is_granted('ROLE_ADMIN')"),
        new Delete(security: "is_granted('ROLE_ADMIN')")
    ]
)]
#[ORM\Entity(repositoryClass: LineInvoiceRepository::class)]
class LineInvoice
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['invoice:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 200)]
    #[Groups(['invoice:read'])] // 👈 AUTORISE L'AFFICHAGE DU NOM DU PRODUIT
    private ?string $LineProduct = null;

    #[ORM\Column]
    #[Groups(['invoice:read'])] // 👈 AUTORISE L'AFFICHAGE DU PRIX
    private ?int $LinePrice = null;

    #[ORM\ManyToOne(inversedBy: 'lineInvoices')]
    private ?Invoice $invoice = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getLineProduct(): ?string
    {
        return $this->LineProduct;
    }

    public function setLineProduct(string $LineProduct): static
    {
        $this->LineProduct = $LineProduct;

        return $this;
    }

    public function getLinePrice(): ?int
    {
        return $this->LinePrice;
    }

    public function setLinePrice(int $LinePrice): static
    {
        $this->LinePrice = $LinePrice;

        return $this;
    }

    public function getInvoice(): ?Invoice
    {
        return $this->invoice;
    }

    public function setInvoice(?Invoice $invoice): static
    {
        $this->invoice = $invoice;

        return $this;
    }
}

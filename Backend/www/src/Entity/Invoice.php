<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use App\Repository\InvoiceRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;

#[ApiFilter(SearchFilter::class, properties: ['person' => 'exact'])]
#[ApiResource(
    operations: [
        new GetCollection(security: "is_granted('ROLE_USER')"),
        new Get(security: "is_granted('ROLE_ADMIN')"),
        new Post(security: "is_granted('ROLE_ADMIN')"),
        new Put(security: "is_granted('ROLE_ADMIN')"),
        new Delete(security: "is_granted('ROLE_ADMIN')")
    ],
    normalizationContext: ['groups' => ['invoice:read']], // 👈 LA RÈGLE
    order: ['createdAt' => 'DESC']
)]
#[ORM\Entity(repositoryClass: InvoiceRepository::class)]
class Invoice
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['invoice:read'])] // 👈 LE BADGE QUI AUTORISE LA SORTIE
    private ?int $id = null;

    #[ORM\Column(length: 200)]
    #[Groups(['invoice:read'])] // 👈 LE BADGE
    private ?string $title = null;

    #[ORM\Column(length: 255)]
    #[Groups(['invoice:read'])] // 👈 LE BADGE
    private ?string $person = null;

    #[ORM\Column(length: 255)]
    #[Groups(['invoice:read'])] // 👈 LE BADGE
    private ?string $path = null;

    #[ORM\Column]
    #[Groups(['invoice:read'])] // 👈 LE BADGE
    private ?\DateTime $createdAt = null;

    #[ORM\OneToMany(targetEntity: LineInvoice::class, mappedBy: 'invoice', cascade: ['persist', 'remove'])]
    #[Groups(['invoice:read'])] // 👈 LE BADGE POUR AFFICHER LES LIGNES DANS LA MODALE
    private Collection $lineInvoices;

    public function __construct()
    {
        $this->lineInvoices = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;

        return $this;
    }

    public function getPerson(): ?string
    {
        return $this->person;
    }

    public function setPerson(string $person): static
    {
        $this->person = $person;

        return $this;
    }

    public function getPath(): ?string
    {
        return $this->path;
    }

    public function setPath(string $path): static
    {
        $this->path = $path;

        return $this;
    }

    public function getCreatedAt(): ?\DateTime
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTime $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getLineInvoices(): Collection
    {
        return $this->lineInvoices;
    }

    public function addLineInvoice(LineInvoice $lineInvoice): static
    {
        if (!$this->lineInvoices->contains($lineInvoice)) {
            $this->lineInvoices->add($lineInvoice);
            $lineInvoice->setInvoice($this);
        }

        return $this;
    }

    public function removeLineInvoice(LineInvoice $lineInvoice): static
    {
        if ($this->lineInvoices->removeElement($lineInvoice)) {
            if ($lineInvoice->getInvoice() === $this) {
                $lineInvoice->setInvoice(null);
            }
        }

        return $this;
    }
}

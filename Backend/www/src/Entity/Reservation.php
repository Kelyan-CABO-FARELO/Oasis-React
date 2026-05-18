<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Delete;
use Symfony\Component\Serializer\Attribute\Groups;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use App\Repository\ReservationRepository;
use App\Controller\GuestCheckoutController;
use App\Entity\Invoice;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;

#[ApiFilter(SearchFilter::class, properties: ['products' => 'exact'])]
#[ApiResource(
    operations: [
        new GetCollection(security: "is_granted('ROLE_USER')"),
        new Get(security: "is_granted('ROLE_ADMIN') or object.getUser() == user"),
        new Post(
            uriTemplate: '/guest-checkout',
            controller: GuestCheckoutController::class,
            read: false,
            deserialize: false,
            name: 'guest_checkout'
        ),
        new Post(security: "is_granted('ROLE_USER')"),
        new Put(security: "is_granted('ROLE_ADMIN')"),
        new Delete(security: "is_granted('ROLE_ADMIN') or object.getUser() == user")
    ],
    normalizationContext: ['groups' => ['reservation:read']],
    denormalizationContext: ['groups' => ['reservation:write']],
    order: ['id' => 'DESC'],
    paginationEnabled: false
)]
#[ORM\Entity(repositoryClass: ReservationRepository::class)]
class Reservation
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['reservation:read'])]
    private ?int $id = null;

    #[ORM\Column]
    #[Groups(['reservation:read', 'reservation:write'])]
    private ?\DateTime $startDate = null;

    #[ORM\Column]
    #[Groups(['reservation:read', 'reservation:write'])]
    private ?\DateTime $endDate = null;

    #[ORM\Column]
    #[Groups(['reservation:read', 'reservation:write'])]
    private ?int $nbChildren = null;

    #[ORM\Column]
    #[Groups(['reservation:read', 'reservation:write'])]
    private ?int $nbAdult = null;

    #[ORM\ManyToOne(inversedBy: 'reservations')]
    #[Groups(['reservation:read', 'reservation:write'])]
    private ?User $user = null;

    #[ORM\ManyToMany(targetEntity: Product::class, mappedBy: 'reservation')]
    #[Groups(['reservation:read', 'reservation:write'])]
    private Collection $products;

    #[ORM\Column]
    #[Groups(['reservation:read', 'reservation:write'])]
    private ?bool $isPaid = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $managementToken = null;

    public function __construct()
    {
        $this->products = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getStartDate(): ?\DateTime
    {
        return $this->startDate;
    }

    public function setStartDate(\DateTime $startDate): static
    {
        $this->startDate = $startDate;

        return $this;
    }

    public function getEndDate(): ?\DateTime
    {
        return $this->endDate;
    }

    public function setEndDate(\DateTime $endDate): static
    {
        $this->endDate = $endDate;

        return $this;
    }

    public function getNbChildren(): ?int
    {
        return $this->nbChildren;
    }

    public function setNbChildren(int $nbChildren): static
    {
        $this->nbChildren = $nbChildren;

        return $this;
    }

    public function getNbAdult(): ?int
    {
        return $this->nbAdult;
    }

    public function setNbAdult(int $nbAdult): static
    {
        $this->nbAdult = $nbAdult;

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getProducts(): Collection
    {
        return $this->products;
    }

    public function addProduct(Product $product): static
    {
        if (!$this->products->contains($product)) {
            $this->products->add($product);
            $product->addReservation($this);
        }

        return $this;
    }

    public function removeProduct(Product $product): static
    {
        if ($this->products->removeElement($product)) {
            $product->removeReservation($this);
        }

        return $this;
    }

    public function getIsPaid(): ?bool
    {
        return $this->isPaid;
    }

    public function setIsPaid(bool $isPaid): static
    {
        $this->isPaid = $isPaid;

        return $this;
    }

    public function getManagementToken(): ?string
    {
        return $this->managementToken;
    }

    public function setManagementToken(?string $managementToken): static
    {
        $this->managementToken = $managementToken;

        return $this;
    }

    #[ORM\Column(nullable: true)]
    #[Groups(['reservation:read', 'reservation:write'])]
    private ?int $poolDays = null;

    public function getPoolDays(): ?int
    {
        return $this->poolDays;
    }

    public function setPoolDays(?int $poolDays): static
    {
        $this->poolDays = $poolDays;
        return $this;
    }

    #[ORM\OneToOne(cascade: ['persist'])]
    #[ORM\JoinColumn(nullable: true)]
    private ?Invoice $invoice = null;

    public function getInvoice(): ?Invoice { return $this->invoice; }
    public function setInvoice(?Invoice $invoice): static { $this->invoice = $invoice; return $this; }
}

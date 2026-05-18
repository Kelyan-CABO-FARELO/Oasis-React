<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\ApiFilter;
use App\Filter\AvailableProductFilter;
use App\Repository\ProductRepository;
use Symfony\Component\Serializer\Attribute\Groups;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ApiResource(

    operations: [
        //  AJOUTEZ CECI POUR FORCER LA LECTURE DES DONNÉES DANS LA LISTE
        new GetCollection(normalizationContext: ['groups' => ['product:read']]),

        //  AJOUTEZ CECI POUR FORCER LA LECTURE DES DONNÉES D'UN SEUL PRODUIT
        new Get(normalizationContext: ['groups' => ['product:read']]),

        new Post(security: "is_granted('ROLE_ADMIN')"),
        new Put(security: "is_granted('ROLE_ADMIN')"),
        new Delete(security: "is_granted('ROLE_ADMIN')")
    ],

    normalizationContext: ['groups' => ['product:read']],
    denormalizationContext: ['groups' => ['product:write']],
    paginationEnabled: false
)]

#[ORM\Entity(repositoryClass: ProductRepository::class)]
class Product
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['product:read', 'reservation:read', 'user:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 200)]
    #[Groups(['product:read', 'product:write', 'reservation:read', 'user:read'])]
    private ?string $title = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['product:read', 'product:write', 'user:read'])]
    private ?string $description = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['product:read', 'product:write', 'user:read'])]
    private ?int $duration = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['product:read', 'product:write', 'user:read'])]
    private ?\DateTimeInterface $contractDate = null;

    #[ORM\OneToMany(targetEntity: Price::class, mappedBy: 'product')]
    #[Groups(['product:read', 'product:write', 'user:read'])]
    private Collection $prices;

    #[ORM\ManyToMany(targetEntity: Media::class, mappedBy: 'product')]
    #[Groups(['product:read', 'product:write'])]
    private Collection $media;

    #[ORM\ManyToMany(targetEntity: User::class, inversedBy: 'products')]
    #[Groups(['product:read'])]
    private Collection $user;

    #[ORM\ManyToMany(targetEntity: Reservation::class, inversedBy: 'products')]
    private Collection $reservation;

    public function __construct()
    {
        $this->prices = new ArrayCollection();
        $this->media = new ArrayCollection();
        $this->user = new ArrayCollection();
        $this->reservation = new ArrayCollection();
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

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getDuration(): ?int
    {
        return $this->duration;
    }

    public function setDuration(?int $duration): static
    {
        $this->duration = $duration;

        return $this;
    }

    public function getPrices(): Collection
    {
        return $this->prices;
    }

    public function addPrice(Price $price): static
    {
        if (!$this->prices->contains($price)) {
            $this->prices->add($price);
            $price->setProduct($this);
        }

        return $this;
    }

    public function removePrice(Price $price): static
    {
        if ($this->prices->removeElement($price)) {
            if ($price->getProduct() === $this) {
                $price->setProduct(null);
            }
        }

        return $this;
    }

    public function getMedia(): Collection
    {
        return $this->media;
    }

    public function addMedium(Media $medium): static
    {
        if (!$this->media->contains($medium)) {
            $this->media->add($medium);
            $medium->addProduct($this);
        }

        return $this;
    }

    public function removeMedium(Media $medium): static
    {
        if ($this->media->removeElement($medium)) {
            $medium->removeProduct($this);
        }

        return $this;
    }

    public function getUser(): Collection
    {
        return $this->user;
    }

    public function addUser(User $user): static
    {
        if (!$this->user->contains($user)) {
            $this->user->add($user);
        }

        return $this;
    }

    public function removeUser(User $user): static
    {
        $this->user->removeElement($user);

        return $this;
    }

    public function getReservation(): Collection
    {
        return $this->reservation;
    }

    public function addReservation(Reservation $reservation): static
    {
        if (!$this->reservation->contains($reservation)) {
            $this->reservation->add($reservation);
        }

        return $this;
    }

    public function removeReservation(Reservation $reservation): static
    {
        $this->reservation->removeElement($reservation);

        return $this;
    }

    public function getContractDate(): ?\DateTimeInterface
    {
        return $this->contractDate;
    }

    public function setContractDate(?\DateTimeInterface $contractDate): static
    {
        $this->contractDate = $contractDate;

        return $this;
    }
}

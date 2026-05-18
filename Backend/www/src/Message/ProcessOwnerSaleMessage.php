<?php
// src/Message/ProcessOwnerSaleMessage.php
namespace App\Message;

class ProcessOwnerSaleMessage
{
    public function __construct(
        private int $userId
    ) {}

    public function getUserId(): int
    {
        return $this->userId;
    }
}

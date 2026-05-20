#!/bin/bash

# ==============================================================================
# Script de lancement tout-en-un pour Oasis-React
# Ce script permet de démarrer le projet sur une machine avec uniquement Docker
# ==============================================================================

echo "🏕️ Démarrage du projet Oasis..."

echo "1️⃣  Lancement du Backend (Symfony & MariaDB)..."
cd Backend
docker compose up -d

echo "⏳ Attente du démarrage du serveur..."
sleep 5

echo "2️⃣  Préparation de la base de données (Symfony)..."
# On exécute les commandes dans le container apache_oasis
docker exec apache_oasis composer install --no-interaction
docker exec apache_oasis php bin/console lexik:jwt:generate-keypair --skip-if-exists --no-interaction
docker exec apache_oasis php bin/console d:d:c --if-not-exists --no-interaction
docker exec apache_oasis php bin/console d:m:m --no-interaction
docker exec apache_oasis php bin/console d:f:l --no-interaction

echo "3️⃣  Lancement du Frontend (React/Vite) avec Docker..."
cd ../Frontend

# Nettoyage d'un éventuel ancien container Frontend
docker stop react_oasis 2>/dev/null || true   # Arrêt
docker rm react_oasis 2>/dev/null || true     # Suppression

# Lancement du Frontend via un container Node.js officiel
# -d : Création du container en arrière-plan
# --name : Nomme le container
# -v : Lie le dossier actuel au dossier /app du container
# -w : Définit le dossier de travail sur /app
# -p : Connexion au port 5173
# node:20-alpine : Téléchargement de l'image alpine (très légère)
# sh -c "..." : Installation des dépendances et lancement du serveur
docker run -d \
  --name react_oasis \
  -v "$PWD":/app \
  -w /app \
  -p 5173:5173 \
  node:20-alpine \
  sh -c "npm install && npm run dev -- --host"

echo "==========================================================="
echo "✅ Démarrage terminé avec succès !"
echo "🌐 L'application Publique (React) est sur : http://localhost:5173"
echo "⚙️  Le Backend API (Symfony) est sur : http://localhost:8088"
echo "==========================================================="
echo "Pour voir les logs du Frontend : docker logs -f react_oasis"

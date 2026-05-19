#!/bin/bash

# ==============================================================================
# Script pour faire tourner la Stripe CLI dans Docker (Aucune installation locale requis !)
# ==============================================================================

echo "💳 Gestion du Webhook Stripe via Docker..."

# 1. Vérification / Connexion au compte Stripe
if [ ! -d "$HOME/.config/stripe" ]; then
    echo "🔑 Première utilisation : Connexion à votre compte Stripe..."
    echo "Un lien d'autorisation et un code vont s'afficher ci-dessous."
    echo "Suivez le lien pour autoriser la connexion avec votre compte Stripe (gratuit)."
    echo "----------------------------------------------------------------------"
    read -p "Appuyez sur [Entrée] pour commencer la connexion..."
    
    # Connexion à votre compte Stripe :
    # --rm : Supprime le conteneur automatiquement après l'utilisation
    # -it : Mode interactif pour pouvoir lire le code de connexion
    # -v : Enregistre les clés d'autorisation dans votre dossier perso sur votre PC pour ne pas se reconnecter à chaque fois
    # stripe/stripe-cli login : Lance l'action de connexion officielle de Stripe
    docker run --rm -it \
      -v "$HOME/.config/stripe:/root/.config/stripe" \
      stripe/stripe-cli login
fi

# 2. Lancement de l'écouteur
echo "🔌 Lancement de l'écoute des Webhooks..."
echo "Les paiements de test seront redirigés vers votre API locale (port 8088)."
echo "Appuyez sur [Ctrl + C] pour arrêter l'écoute à la fin de votre démo."
echo "----------------------------------------------------------------------"

# Détection de l'OS pour la communication Docker -> Machine Hôte
ADD_HOST=""
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Requis sous Linux pour utiliser host.docker.internal
    ADD_HOST="--add-host=host.docker.internal:host-gateway"
fi

# Écoute et redirection des Webhooks :
# --rm -it : Lance le conteneur de manière interactive et le détruit à l'arrêt (Ctrl+C)
# $ADD_HOST : Option spéciale requise uniquement sous Linux pour pouvoir contacter votre PC
# -v : Utilise les clés de connexion stockées précédemment pour s'authentifier auprès de Stripe
# stripe/stripe-cli : L'image officielle Stripe
# listen --forward-to... : Écoute les événements Stripe et les renvoie vers votre API sur le port 8088 de votre PC
docker run --rm -it \
  $ADD_HOST \
  -v "$HOME/.config/stripe:/root/.config/stripe" \
  stripe/stripe-cli \
  listen --forward-to host.docker.internal:8088/webhook/stripe

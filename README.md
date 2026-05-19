# 🏕️ Domaine L'Oasis - Plateforme de Réservation & Gestion

Une application web complète (React & Symfony) développée pour répondre au cahier des charges du Domaine L'Oasis, un prestigieux camping 3 étoiles situé entre la Mer Méditerranée et les Pyrénées.

---

## ✨ Fonctionnalités Principales

L'application est divisée en **3 espaces distincts** répondant à des contraintes métiers précises :

### 1. 🌍 Espace Public (Réservations)
- **Ouverture Saisonnière :** Les réservations sont strictement limitées à la période d'ouverture du camping (05 Mai au 10 Octobre).
- **Tarification Dynamique :** 
  - Majoration automatique de **15% en Haute Saison** (21 Juin - 31 Août).
  - Remise automatique de **5% par tranche de 7 jours** loués (plafonnée à 25%).
- **Taxes & Extras :** Calcul automatique de la taxe de séjour (selon l'âge) et option de facturation de l'accès à l'espace aquatique (par personne et par jour).
- **Paiement Sécurisé :** Intégration complète de l'API **Stripe** pour les paiements en ligne.

### 2. 👑 Espace Administrateur (Gestion & Comptabilité)
- **Dashboard Global :** Vue d'ensemble des réservations, des paiements et occupation du parc de 90 biens.
- **Grille Tarifaire Dynamique :** Interface intuitive permettant de modifier le prix de base d'un "type" de bien, répercutant automatiquement le prix sur l'ensemble du parc.
- **Facturation Légale :** Édition de factures PDF et génération automatique **d'Avoirs (AV-CANCEL)** en cas d'annulation.
- **Conformité RGPD Avancée :**
  - Outil de purge automatique/anonymisation des locataires après 1 semaine (ou 1 an avec consentement).
  - Alertes pour l'archivage obligatoire des factures datant de plus de 3 ans.
  - Anonymisation complète des propriétaires 1 an après la fin de leur contrat.

### 3. 🏡 Espace Propriétaire
- **Suivi d'Occupation :** Calendrier personnalisé pour surveiller l'occupation de son propre bien.
- **Rétributions Automatisées :** Un script métier (`app:owner:generate-retributions`) génère automatiquement, en fin de saison, la facture de versement du propriétaire, correspondant très exactement à **35% du montant brut** de chaque location (Taxes de séjour et Piscine déduites).

---

## 🛠️ Architecture Technique

- **Frontend :** React 18, Vite, React Router, TailwindCSS.
- **Backend :** Symfony 7, API Platform, PHP 8.2, MySQL/MariaDB.
- **Génération PDF :** Dompdf (via Twig).
- **Infrastructure :** Conteneurisation complète avec Docker & Docker Compose.

---

## 🚀 Installation & Lancement Rapide (100% Docker)

L'application est conçue pour démarrer **sur une machine vierge possédant uniquement Docker** (aucun prérequis Node.js ou PHP n'est nécessaire sur la machine hôte).

Un script `start.sh` automatisé s'occupe de construire l'environnement, installer les dépendances et exécuter les migrations de base de données.

### Étape 1 : Cloner le dépôt et lancer le script

```bash
git clone https://github.com/Kelyan-CABO-FARELO/Oasis-React.git
cd Oasis-React

# Rendre le script exécutable
chmod +x start.sh

# Lancer la magie Docker 🐳
./start.sh
```

### Étape 2 : Accéder à l'application

Une fois le script terminé, l'application est prête à l'emploi :

- **🖥️ Application Publique (Frontend) :** [http://localhost:5173](http://localhost:5173)
- **⚙️ Backend API (Symfony) :** [http://localhost:8088/api](http://localhost:8088/api)

> *Note : Le Frontend est lancé dans un container Node.js éphémère. Si vous fermez le terminal, le frontend pourrait s'arrêter. Vous pouvez le relancer en exécutant à nouveau le script.*

---

## 🧑‍💻 Comptes de Démonstration (Fixtures)

La base de données est initialisée avec de faux utilisateurs pour vous permettre de tester les différents espaces sécurisés :

- **👑 Espace Administrateur :**
  - **Email :** `admin@admin.com`
  - **Mot de passe :** `password`

- **🏡 Espace Propriétaire :**
  - Les propriétaires sont générés de manière réaliste avec des noms humoristiques français (ex: `jean.bon@loasis-proprio.fr`, `sarah.vigote@loasis-proprio.fr` ou `yves.remords@loasis-proprio.fr`).
  - **Mot de passe :** `password`

> **Note sur le Client Standard (Vacancier) :** Les clients n'ont pas besoin de se connecter pour effectuer une réservation. Le tunnel d'achat public est totalement accessible "en invité" pour simplifier le parcours.

## 💳 Tester les Webhooks Stripe (Local)

Si vous souhaitez tester le cycle complet de réservation avec le paiement (et voir les factures passer du statut "En attente" à "Payé"), vous n'avez pas besoin d'installer la Stripe CLI sur votre ordinateur ! 

J'ai créé un script `stripe.sh` qui utilise l'image officielle Docker de Stripe pour faire le pont en toute sécurité.

Dans un **terminal séparé**, à la racine du projet, lancez simplement :

```bash
# Rendre le script exécutable (la première fois uniquement)
chmod +x stripe.sh

# Lancer la redirection
./stripe.sh
```

La première fois, le script affichera un lien et un code. Suivez le lien pour vous connecter à votre compte Stripe de test, puis la redirection s'activera d'elle-même.

Assurez-vous également que vos clés Stripe de test sont configurées dans le fichier `Backend/www/.env.local`.
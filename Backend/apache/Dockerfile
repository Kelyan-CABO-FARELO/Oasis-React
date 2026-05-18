# 1. BASE IMAGE & ARGUMENTS
FROM php:8.4-apache

# Arguments pour les versions (bonne pratique)
ARG NVM_VERSION=0.39.7
ARG NODE_VERSION=20

# 2. SYSTÈME ET DÉPENDANCES
# Installation des outils système (git, unzip, wget, curl) et des dépendances pour les extensions PHP.
# Le tout est fait en une seule commande pour optimiser les couches Docker.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        unzip \
        wget \
        libpng-dev \
        libjpeg-dev \
        libfreetype6-dev \
        libicu-dev \
        curl \
        nano \
    && rm -rf /var/lib/apt/lists/*

# 3. EXTENSIONS PHP
# Configuration et installation des extensions courantes pour Symfony (gd, intl, pdo, opcache).
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        gd \
        intl \
        pdo \
        pdo_mysql \
        opcache

# 4. COMPOSER
# Utilisation de l'image composer:latest pour obtenir la dernière version stable automatiquement.
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 5. SYMFONY CLI (CORRIGÉ & ROBUSTE)
# Installation via curl de l'installateur officiel Symfony
# Installation de Symfony CLI
RUN wget https://get.symfony.com/cli/installer -O - | bash \
  && mv /root/.symfony*/bin/symfony /usr/local/bin/symfony

# 6. XDEBUG
# Installation et activation de Xdebug via PECL.
RUN pecl install xdebug \
    && docker-php-ext-enable xdebug

# Copie de la configuration PHP personnalisée (pour les paramètres Xdebug, etc.)
COPY custom-php.ini /usr/local/etc/php/conf.d/

# 7. NVM et NODE.JS (Optionnel)
ENV NVM_DIR=/root/.nvm
ENV PATH=$NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v$NVM_VERSION/install.sh | bash \
    && /bin/bash -c "source $NVM_DIR/nvm.sh && nvm install $NODE_VERSION && nvm alias default $NODE_VERSION && nvm use default" \
    && rm -rf /tmp/*

# 8. CONFIGURATION APACHE
# Redéfinit le Document Root pour pointer vers le répertoire 'public' de Symfony.
# Active le module rewrite.
RUN sed -i 's|/var/www/html|/var/www/html/public|g' /etc/apache2/sites-available/000-default.conf \
    && echo "<Directory /var/www/html/public>\n\
    AllowOverride All\n\
    Require all granted\n\
    </Directory>" >> /etc/apache2/apache2.conf \
    && a2enmod rewrite

# 9. PERMISSIONS
# L'utilisateur www-data doit pouvoir écrire dans les répertoires var/log et var/cache.
RUN chown -R www-data:www-data /var/www/html \
    && find /var/www/html -type d -exec chmod 775 {} \; \
    && find /var/www/html -type f -exec chmod 644 {} \;

# 10. POINT D'ENTRÉE
# Le port par défaut d'Apache est exposé.
EXPOSE 80

# Le point d'entrée par défaut de l'image php:*-apache démarre Apache.
# CMD ["apache2-foreground"]
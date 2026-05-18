// src/utils/pricing.js

// 1. Fonction pour définir la haute saison
export const isHighSeason = (date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    if (month === 7 || month === 8) return true; // Juillet et Août
    if (month === 6 && day >= 21) return true; // À partir du 21 Juin
    return false;
};

// 2. Le gros moteur de calcul qui prend tous les paramètres et recrache le ticket de caisse
export const calculateTripPrice = (basePrice, start, end, adults, children, extras, poolOptions) => {
    const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

    let rawAccommodation = 0;
    let highSeasonNights = 0;
    let lowSeasonNights = 0;

    let currentDate = new Date(start);
    for (let i = 0; i < nights; i++) {
        if (isHighSeason(currentDate)) {
            rawAccommodation += basePrice * 1.15; // +15%
            highSeasonNights++;
        } else {
            rawAccommodation += basePrice;
            lowSeasonNights++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Remise max 25%
    const discountMultiplier = Math.min(Math.floor(nights / 7) * 0.05, 0.25);
    const discountAmount = rawAccommodation * discountMultiplier;
    const finalAccommodation = rawAccommodation - discountAmount;

    // Taxes
    const totalTaxes = (extras.taxeAdulte * adults * nights) + (extras.taxeEnfant * children * nights);

    // Piscine
    let totalPool = 0;
    if (poolOptions.wantsPool) {
        totalPool = (extras.piscineAdulte * adults * poolOptions.poolDays) + (extras.piscineEnfant * children * poolOptions.poolDays);
    }

    const grandTotal = finalAccommodation + totalTaxes + totalPool;

    // On retourne toutes les valeurs utiles pour le résumé !
    return {
        nights,
        rawAccommodation,
        highSeasonNights,
        lowSeasonNights,
        discountMultiplier,
        discountAmount,
        finalAccommodation,
        totalTaxes,
        totalPool,
        grandTotal
    };
};
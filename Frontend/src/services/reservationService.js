import { apiFetch } from "./api.js";

export const reservationService = {
    /**
     * Envoie les données du formulaire invité pour créer le compte et la réservation
     * @param {Object} payload Les données du client et du séjour
     */
    createGuestReservation: async (payload) => {
        // On va appeler une route spéciale (que l'on va créer côté Symfony juste après)
        return await apiFetch('/guest-checkout', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }
};
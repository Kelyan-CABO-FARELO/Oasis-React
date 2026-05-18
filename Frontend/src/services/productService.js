// src/services/productService.js
import { apiFetch } from "./api.js";

export const productService = {
    /**
     * Récupère TOUS les produits (Hébergements + Extras) sans pagination
     */
    getAll: async () => {
        const data = await apiFetch('/products?pagination=false');
        return data['member'] || data['hydra:member'] || (Array.isArray(data) ? data : []);
    },

    /**
     * Récupère un seul produit par son ID
     */
    getById: async (id) => {
        return await apiFetch(`/products/${id}`);
    },

    /**
     * Cherche les hébergements disponibles selon des dates
     */
    getAvailable: async (startDate, endDate) => {
        let url = '/products?pagination=false';
        if (startDate && endDate) {
            url += `&startDate=${startDate}&endDate=${endDate}`;
        }
        const data = await apiFetch(url);

        // On retourne la liste filtrée
        return data['member'] || data['hydra:member'] || (Array.isArray(data) ? data : []);
    }
};
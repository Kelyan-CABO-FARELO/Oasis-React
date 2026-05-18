// src/services/api.js
import { API_URL } from "../constants/apiConstant.js";
import { TOKEN_KEY } from "../constants/appConstants.js";

/**
 * Fonction centrale pour tous les appels à l'API Symfony.
 * Elle gère automatiquement les headers et le format JSON/JSON-LD.
 */
export const apiFetch = async (endpoint, options = {}) => {
    // 1. Récupération du token s'il existe (pour les futures requêtes privées)
    const token = localStorage.getItem(TOKEN_KEY);

    // 2. Configuration des headers par défaut
    const headers = {
        'Accept': 'application/ld+json',
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // 3. Injection du token si l'utilisateur est connecté
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // 4. Exécution de la requête
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // 5. Gestion globale des erreurs
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Une erreur est survenue lors de la requête API.");
    }

    return response.json();
};
import { API_ROOT } from "../constants/apiConstant.js";

export const authService = {
    /**
     * Tente de connecter l'utilisateur via l'API Symfony
     * @param {string} email
     * @param {string} password
     */
    login: async (email, password) => {
        // Symfony (json_login) attend par défaut la clé "username" même si on utilise un email
        const response = await fetch(`${API_ROOT}/api/login_check`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: email,
                password: password
            })
        });

        if (!response.ok) {
            throw new Error("Identifiants incorrects.");
        }

        const data = await response.json();

        // LexikJWT renvoie le token dans data.token
        // Note: Pour récupérer les infos (userId, email, etc.), il faudra soit les inclure dans le payload du token (côté Symfony), soit décoder le token ici.
        return data.token;
    }
};
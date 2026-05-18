import { createContext, useContext, useState } from "react";
import { USER_INFOS, TOKEN_KEY } from "../constants/appConstants.js";

const AuthContext = createContext({
    userId: '',
    email: '',
    nickname: '',
    roles: [], // 👈 AJOUT
    setUserId: () => {},
    setEmail: () => {},
    setNickname: () => {},
    setRoles: () => {}, // 👈 AJOUT
    signIn: async () => {},
    signOut: async () => {}
})

const AuthContextProvider = ({children}) => {
    const [userId, setUserId] = useState('');
    const [email, setEmail] = useState('');
    const [nickname, setNickname] = useState('');
    const [roles, setRoles] = useState([]); // 👈 AJOUT

    const signIn = async (user, token) => {
        try {
            setUserId(user.userId);
            setEmail(user.email);
            setNickname(user.nickname);
            setRoles(user.roles || []); // 👈 AJOUT

            localStorage.setItem(USER_INFOS, JSON.stringify(user));
            localStorage.setItem(TOKEN_KEY, token);
        } catch (error) {
            throw new Error(`Erreur lors de la connexion: ${error}`);
        }
    };

    const signOut = async () => {
        try {
            setUserId('');
            setEmail('');
            setNickname('');
            setRoles([]); // 👈 AJOUT

            localStorage.removeItem(USER_INFOS);
            localStorage.removeItem(TOKEN_KEY);

            // Redirige proprement vers la page d'accueil uniquement si l'utilisateur était sur une route protégée
            const isProtectedRoute = window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/owner');
            if (isProtectedRoute) {
                window.location.href = '/';
            }
        } catch (error) {
            throw new Error(`Erreur lors de la déconnexion: ${error}`);
        }
    }

    const value = {
        userId, email, nickname, roles,
        setUserId, setEmail, setNickname, setRoles,
        signIn, signOut
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
};

const useAuthContext = () => useContext(AuthContext);

export {AuthContext, AuthContextProvider, useAuthContext};
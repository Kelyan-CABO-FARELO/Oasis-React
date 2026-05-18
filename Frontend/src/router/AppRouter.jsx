import React, { useEffect, useState } from 'react';
import { RouterProvider } from "react-router-dom";
import OfflineRouter from "./OfflineRouter.jsx";
import OnlineRouter from "./OnlineRouter.jsx";
import { useAuthContext } from "../contexts/AuthContext.jsx";
import { TOKEN_KEY, USER_INFOS } from "../constants/appConstants.js";
import PageLoader from "../components/Loader/PageLoader.jsx";

const AppRouter = () => {
    const [isChecking, setIsChecking] = useState(true);
    // 👇 On récupère setRoles
    const { userId, setUserId, setEmail, setNickname, setRoles, signOut } = useAuthContext();

    useEffect(() => {
        const checkUserSession = async () => {
            const token = localStorage.getItem(TOKEN_KEY);
            const userInfosStr = localStorage.getItem(USER_INFOS);

            // 🛑 LE VIGILE : Si le local storage est vide ou partiel, on nettoie et on continue en mode déconnecté !
            if (!token || !userInfosStr) {
                localStorage.removeItem(USER_INFOS);
                localStorage.removeItem(TOKEN_KEY);
                setIsChecking(false);
                return; // On arrête l'exécution ici
            }

            try {
                const userInfos = JSON.parse(userInfosStr);
                const payload = JSON.parse(atob(token.split('.')[1]));
                const isTokenExpired = payload.exp * 1000 < Date.now();

                if (isTokenExpired) {
                    await signOut();
                } else {
                    setUserId(userInfos.userId);
                    setEmail(userInfos.email);
                    setNickname(userInfos.nickname);
                    setRoles(userInfos.roles || payload.roles || []);
                }
            } catch (error) {
                console.error("Données corrompues", error);
                await signOut();
            }

            setIsChecking(false);
        };

        checkUserSession();
    }, []);

    if (isChecking) {
        return <PageLoader />;
    }

    return (
        <RouterProvider
            key={userId ? 'online' : 'offline'}
            router={userId ? OnlineRouter : OfflineRouter}
        />
    );
};

export default AppRouter;
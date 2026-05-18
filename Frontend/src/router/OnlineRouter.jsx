import { createBrowserRouter, Navigate } from "react-router-dom";
import React from "react";
import AdminDashboard from "../screens/OnlineScreens/AdminDashboard.jsx";
import OwnerDashboard from "../screens/OnlineScreens/OwnerDashboard.jsx";
import { useAuthContext } from "../contexts/AuthContext.jsx";
import CreatePassword from "../screens/OfflineScreens/CreatePassword.jsx";

const RootRedirect = () => {
    const { roles, signOut } = useAuthContext();

    // Si on est en mode "Online" mais qu'on n'a aucun rôle valide,
    // c'est que la session est corrompue : on déconnecte.
    if (!roles || roles.length === 0) {
        signOut();
        return <Navigate to="/login" replace />;
    }

    if (roles.includes('ROLE_ADMIN')) {
        return <Navigate to="/admin" replace />;
    } else if (roles.includes('ROLE_OWNER')) {
        return <Navigate to="/owner" replace />;
    }

    return <Navigate to="/login" replace />;
};

const AdminGuard = () => {
    const { roles } = useAuthContext();
    return roles.includes('ROLE_ADMIN') ? <AdminDashboard /> : <Navigate to="/" replace />;
};

const OwnerGuard = () => {
    const { roles } = useAuthContext();
    return roles.includes('ROLE_OWNER') ? <OwnerDashboard /> : <Navigate to="/" replace />;
};

const OnlineRouter = createBrowserRouter([
    {
        path: "/",
        element: <RootRedirect />,
    },
    {
        path: "/admin",
        element: <AdminGuard />,
    },
    {
        path: "/owner",
        element: <OwnerGuard />,
    },
    {
        path: "/password",
        element: <CreatePassword />,
    },
    {
        path: "*",
        element: <Navigate to="/" replace />
    }
]);

export default OnlineRouter;
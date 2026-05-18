import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

const MainLayout = () => {
    return (
        <div className="flex flex-col min-h-screen">
            {/* La barre de navigation toujours en haut */}
            <Header />

            {/* Le contenu de la page (Accueil, Produits, Checkout...) s'injecte ici ! */}
            <main className="flex-grow">
                <Outlet />
            </main>

            {/* Le pied de page toujours en bas */}
            <Footer />
        </div>
    );
};

export default MainLayout;
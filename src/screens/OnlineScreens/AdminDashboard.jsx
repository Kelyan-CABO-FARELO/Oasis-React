import React, { useState, useEffect } from 'react';
import ReservationList from '../../components/Admin/ReservationList.jsx';
import UserList from '../../components/Admin/UserList.jsx';
import CampingMapProduct from '../../components/Map/CampingMapProduct.jsx';
import InvoiceList from '../../components/Admin/InvoiceList.jsx';
import { productService } from '../../services/productService.js';
import { useAuthContext } from '../../contexts/AuthContext.jsx';
import OwnerRequests from '../../components/Admin/OwnerRequests.jsx';
import RgpdDashboard from '../../components/Admin/RgpdDashboard.jsx';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('reservations');
    const { signOut } = useAuthContext();

    // États pour la carte interactive
    const [allProducts, setAllProducts] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [loadingMap, setLoadingMap] = useState(true);

    useEffect(() => {
        const fetchMapData = async () => {
            if (activeTab !== 'map') return;

            setLoadingMap(true);
            try {
                const products = await productService.getAll();
                const realHousing = products.filter(p => p.title && !p.title.toLowerCase().includes('piscine'));
                setAllProducts(realHousing);

                const today = new Date().toISOString().split('T')[0];
                const available = await productService.getAvailable(today, today);
                setAvailableProducts(available);

            } catch (err) {
                console.error("Erreur chargement Map:", err);
            } finally {
                setLoadingMap(false);
            }
        };

        fetchMapData();
    }, [activeTab]);

    const getMenuClass = (tabName) => {
        const isActive = activeTab === tabName;
        return `w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition-all duration-200 ${
            isActive
                ? 'bg-amber-100 text-amber-800 shadow-sm border border-amber-200'
                : 'text-slate-600 hover:bg-amber-50 hover:text-amber-700'
        }`;
    };

    return (
        <div className="min-h-screen bg-[#fffdf0] flex font-sans">

            {/* SIDEBAR */}
            <aside className="w-64 bg-white border-r border-amber-100 flex flex-col shadow-sm fixed h-full z-10">
                <div className="p-6 border-b border-amber-100">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                        Admin<span className="text-amber-500">Camp</span>
                    </h1>
                    <p className="text-xs text-amber-600 font-bold uppercase mt-1">Espace Admin</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button onClick={() => setActiveTab('reservations')} className={getMenuClass('reservations')}>
                        <span className="text-xl">📅</span> Réservations
                    </button>

                    <button onClick={() => setActiveTab('users')} className={getMenuClass('users')}>
                        <span className="text-xl">👥</span> Clients
                    </button>

                    {/* 👇 2. AJOUT DU BOUTON FACTURES */}
                    <button onClick={() => setActiveTab('invoices')} className={getMenuClass('invoices')}>
                        <span className="text-xl">🧾</span> Factures
                    </button>

                    <button onClick={() => setActiveTab('map')} className={getMenuClass('map')}>
                        <span className="text-xl">🗺️</span> Plan du Camping
                    </button>

                    <button onClick={() => setActiveTab('owner-requests')} className={getMenuClass('owner-requests')}
                    >
                        🤝 Demandes Propriétaires
                    </button>

                    <button onClick={() => setActiveTab('rgpd')} className={getMenuClass('rgpd')}>
                        <span className="text-xl">🔒</span> Conformité RGPD
                    </button>
                </nav>

                <div className="p-4 border-t border-amber-100">
                    <button
                        onClick={signOut}
                        className="w-full px-4 py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors flex items-center gap-3"
                    >
                        <span className="text-xl">🚪</span> Déconnexion
                    </button>
                </div>
            </aside>

            {/* CONTENU PRINCIPAL */}
            <main className="flex-1 ml-64 p-8">

                <div className="mb-8">
                    <h2 className="text-3xl font-black text-slate-800">
                        {activeTab === 'reservations' && 'Gestion des Réservations'}
                        {activeTab === 'users' && 'Base de données Clients'}
                        {activeTab === 'invoices' && 'Comptabilité & Factures'}
                        {activeTab === 'map' && "Disponibilités en temps réel"}
                        {activeTab === 'rgpd' && 'Sécurité & Conformité RGPD'}
                    </h2>
                    <p className="text-slate-600 font-medium mt-1">
                        {activeTab === 'reservations' && 'Consultez et gérez les séjours de vos vacanciers.'}
                        {activeTab === 'users' && 'Retrouvez les fiches détaillées de vos clients.'}
                        {activeTab === 'invoices' && 'Consultez les factures et surveillez les délais de conservation (3 ans).'}
                        {activeTab === 'map' && 'Visualisez les emplacements libres et occupés aujourd\'hui sur le domaine.'}
                        {activeTab === 'rgpd' && 'Surveillez et gérez la conservation légale de vos données.'}
                    </p>
                </div>

                <div className="animate-fade-in-up">
                    {activeTab === 'reservations' && <ReservationList />}

                    {activeTab === 'users' && <UserList />}

                    {activeTab === 'invoices' && <InvoiceList />}

                    {activeTab === 'map' && (
                        <div className="max-w-5xl mx-auto">
                            {loadingMap ? (
                                <div className="bg-white rounded-[2rem] shadow-xl border border-amber-50 p-12 flex flex-col items-center justify-center min-h-[400px] gap-4 text-amber-600 animate-pulse">
                                    <span className="text-5xl">🗺️</span>
                                    <p className="font-bold text-lg">Analyse du terrain en cours...</p>
                                </div>
                            ) : (
                                <CampingMapProduct
                                    isAdmin={true}
                                    allProducts={allProducts}
                                    availableProducts={availableProducts}
                                    selectedCategory="all"
                                    totalOccupants={0}
                                />
                            )}
                        </div>
                    )}

                    {activeTab === 'owner-requests' && <OwnerRequests />}

                    {activeTab === 'rgpd' && <RgpdDashboard />}
                </div>

            </main>
        </div>
    );
};

export default AdminDashboard;
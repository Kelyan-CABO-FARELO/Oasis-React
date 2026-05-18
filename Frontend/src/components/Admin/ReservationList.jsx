import React, { useEffect, useState } from 'react';
import { API_ROOT } from '../../constants/apiConstant.js';
import { TOKEN_KEY } from '../../constants/appConstants.js';

const ReservationList = () => {
    // États pour les données
    const [reservations, setReservations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedReservation, setSelectedReservation] = useState(null);

    // 👇 NOUVEL ÉTAT : Le terme recherché dans la barre
    const [searchTerm, setSearchTerm] = useState('');

    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchReservations = async () => {
            const token = localStorage.getItem(TOKEN_KEY);
            try {
                const response = await fetch(`${API_ROOT}/api/reservations`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/ld+json'
                    }
                });

                if (!response.ok) throw new Error("Impossible de charger les réservations.");

                const data = await response.json();

                let list = [];
                if (data.member) {
                    list = data.member;
                } else if (data['hydra:member']) {
                    list = data['hydra:member'];
                } else if (Array.isArray(data)) {
                    list = data;
                } else {
                    throw new Error("Format de données inattendu de la part du serveur.");
                }

                const sortedList = [...list].sort((a, b) => b.id - a.id);
                setReservations(sortedList);

            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReservations();
    }, []);

    // 👇 RÉINITIALISATION : On retourne à la page 1 si on fait une nouvelle recherche
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // 👇 LOGIQUE DE FILTRAGE (Recherche par nom ou prénom)
    const filteredReservations = reservations.filter((res) => {
        if (!searchTerm) return true; // Si la barre est vide, on garde tout

        const fullName = res.user ? `${res.user.firstname} ${res.user.lastname}`.toLowerCase() : 'invité';
        return fullName.includes(searchTerm.toLowerCase());
    });

    // 👇 LOGIQUE DE PAGINATION (Appliquée sur les résultats filtrés !)
    const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentReservations = filteredReservations.slice(indexOfFirstItem, indexOfLastItem);

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    if (isLoading) return <div className="text-slate-500 font-bold animate-pulse">Chargement des données...</div>;
    if (error) return <div className="text-red-500 font-bold">❌ {error}</div>;

    return (
        <div className="relative">

            {/* ========================================= */}
            {/* 🔍 BARRE DE RECHERCHE */}
            {/* ========================================= */}
            <div className="mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between gap-4">
                <div className="relative w-full max-w-md">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 text-lg">
                        🔍
                    </span>
                    <input
                        type="text"
                        placeholder="Rechercher par nom de client..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border-2 border-slate-100 rounded-xl focus:outline-none focus:border-amber-400 bg-slate-50 transition-colors font-medium text-slate-700"
                    />
                </div>
                {searchTerm && (
                    <div className="text-sm font-bold text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
                        {filteredReservations.length} résultat(s) trouvé(s)
                    </div>
                )}
            </div>

            {/* ========================================= */}
            {/* 📋 LE TABLEAU */}
            {/* ========================================= */}
            <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="border-b-2 border-slate-100 text-slate-400 uppercase text-xs tracking-wider">
                        <th className="pb-4 pt-2 px-2 font-bold">N°</th>
                        <th className="pb-4 pt-2 px-2 font-bold">Client</th>
                        <th className="pb-4 pt-2 px-2 font-bold">Dates</th>
                        <th className="pb-4 pt-2 px-2 font-bold">Hébergement</th>
                        <th className="pb-4 pt-2 px-2 font-bold">Voyageurs</th>
                        <th className="pb-4 pt-2 px-2 font-bold">Statut</th>
                        <th className="pb-4 pt-2 px-2 font-bold text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="text-sm font-medium text-slate-700">
                    {currentReservations.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="py-12 text-center text-slate-400">
                                <span className="text-4xl block mb-3">🧐</span>
                                Aucune réservation trouvée pour cette recherche.
                            </td>
                        </tr>
                    ) : (
                        currentReservations.map((res) => {
                            const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
                            const start = new Date(res.startDate).toLocaleDateString('fr-FR', dateOptions);
                            const end = new Date(res.endDate).toLocaleDateString('fr-FR', dateOptions);

                            const mainProduct = res.products?.find(p => !p.title.toLowerCase().includes('piscine'));
                            const productTitle = mainProduct ? mainProduct.title : 'Inconnu';
                            const estPaye = res.isPaid === true || res.paid === true;

                            return (
                                <tr key={res.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                    <td className="py-4 px-2 font-black text-slate-900">#{res.id}</td>
                                    <td className="py-4 px-2">
                                        {res.user ? `${res.user.firstname} ${res.user.lastname}` : 'Invité'}
                                    </td>
                                    <td className="py-4 px-2 text-slate-500">Du {start} au {end}</td>
                                    <td className="py-4 px-2">{productTitle}</td>
                                    <td className="py-4 px-2 text-slate-500">{res.nbAdult} Ad. / {res.nbChildren} Enf.</td>
                                    <td className="py-4 px-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${estPaye ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {estPaye ? 'Payé' : 'En attente'}
                                            </span>
                                    </td>
                                    <td className="py-4 px-2 text-right">
                                        <button
                                            onClick={() => setSelectedReservation(res)}
                                            className="text-amber-500 hover:text-amber-700 hover:bg-amber-100 font-bold px-4 py-2 bg-amber-50 rounded-lg transition-colors"
                                        >
                                            Détails
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                    </tbody>
                </table>
            </div>

            {/* ========================================= */}
            {/* 🔽 CONTRÔLES DE PAGINATION */}
            {/* ========================================= */}
            {filteredReservations.length > 0 && (
                <div className="flex items-center justify-between mt-6 px-2">
                    <p className="text-sm text-slate-500 font-medium">
                        Affichage de <span className="font-bold text-slate-900">{indexOfFirstItem + 1}</span> à <span className="font-bold text-slate-900">{Math.min(indexOfLastItem, filteredReservations.length)}</span> sur <span className="font-bold text-slate-900">{filteredReservations.length}</span>
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            Précédent
                        </button>
                        <div className="px-4 py-2 bg-slate-50 border border-slate-100 text-slate-600 rounded-lg font-bold">
                            Page {currentPage} / {totalPages}
                        </div>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            Suivant
                        </button>
                    </div>
                </div>
            )}

            {/* ========================================= */}
            {/* 🪄 LA MODALE DE DÉTAILS */}
            {/* ========================================= */}
            {selectedReservation && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">Réservation #{selectedReservation.id}</h3>
                                <p className="text-slate-500 font-medium mt-1">Détails complets du séjour</p>
                            </div>
                            <button
                                onClick={() => setSelectedReservation(null)}
                                className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors font-bold text-xl pb-1"
                            >
                                x
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto space-y-8">
                            {/* Section Client */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">👤 Informations Client</h4>
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                    <p className="font-bold text-slate-900 text-lg">
                                        {selectedReservation.user ? `${selectedReservation.user.firstname} ${selectedReservation.user.lastname}` : 'Client Invité (Non inscrit)'}
                                    </p>
                                    {selectedReservation.user?.email && (
                                        <p className="text-slate-500 font-medium mt-1">📧 {selectedReservation.user.email}</p>
                                    )}
                                </div>
                            </div>

                            {/* Section Séjour */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">🏕️ Détails du Séjour</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                        <p className="text-amber-700 text-sm font-bold mb-1">Arrivée</p>
                                        <p className="font-black text-amber-900">
                                            {new Date(selectedReservation.startDate).toLocaleDateString('fr-FR')}
                                        </p>
                                    </div>
                                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                        <p className="text-amber-700 text-sm font-bold mb-1">Départ</p>
                                        <p className="font-black text-amber-900">
                                            {new Date(selectedReservation.endDate).toLocaleDateString('fr-FR')}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 col-span-2 flex justify-between items-center">
                                        <div>
                                            <p className="text-slate-500 text-sm font-bold mb-1">Hébergement</p>
                                            <p className="font-bold text-slate-900">
                                                {(() => {
                                                    const mainProd = selectedReservation.products?.find(p => !p.title.toLowerCase().includes('piscine'));
                                                    return mainProd ? mainProd.title : 'Non spécifié';
                                                })()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-slate-500 text-sm font-bold mb-1">Voyageurs</p>
                                            <p className="font-bold text-slate-900">
                                                {selectedReservation.nbAdult} Adultes, {selectedReservation.nbChildren} Enfants
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section Options & Extras */}
                            {(() => {
                                const poolProducts = selectedReservation.products?.filter(p => p.title.toLowerCase().includes('piscine'));
                                const hasPoolAccess = poolProducts && poolProducts.length > 0;

                                return (
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">🏊‍♂️ Options & Extras</h4>
                                        <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100 flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-2xl">
                                                    🌊
                                                </div>
                                                <div>
                                                    <p className="text-sky-900 font-bold">Accès Espace Aquatique</p>

                                                    {hasPoolAccess ? (
                                                        <>
                                                            <div className="flex flex-wrap gap-2 mt-2 mb-1">
                                                                {poolProducts.map(p => (
                                                                    <span key={p.id} className="bg-white border border-sky-200 text-sky-700 px-2 py-1 rounded text-xs font-bold shadow-sm">
                                                                        {p.title}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            <p className="text-sky-700 font-medium text-sm">
                                                                Valable pour <span className="font-black">{selectedReservation.poolDays} jour(s)</span>
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <p className="text-slate-400 font-medium mt-1">Option non souscrite / non incluse</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                {hasPoolAccess ? (
                                                    <span className="bg-sky-200 text-sky-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">Actif</span>
                                                ) : (
                                                    <span className="bg-slate-200 text-slate-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Inactif</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Section Paiement */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">💳 Statut du Paiement</h4>
                                <div className={`p-5 rounded-2xl border flex items-center justify-between ${(selectedReservation.isPaid || selectedReservation.paid) ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${(selectedReservation.isPaid || selectedReservation.paid) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {(selectedReservation.isPaid || selectedReservation.paid) ? '✅ Paiement validé' : '⏳ En attente de paiement'}
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationList;
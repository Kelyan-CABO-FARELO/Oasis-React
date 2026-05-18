import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../services/api';
import { useAuthContext } from '../../contexts/AuthContext.jsx';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const OwnerDashboard = () => {
    const [ownerData, setOwnerData] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [pendingEarnings, setPendingEarnings] = useState([]);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'invoices'
    const [loading, setLoading] = useState(true);

    // Modal state for reservation
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [bookingStartDate, setBookingStartDate] = useState(null);
    const [bookingEndDate, setBookingEndDate] = useState(null);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingMessage, setBookingMessage] = useState(null);
    
    // Reservations state for blocking dates
    const [productReservations, setProductReservations] = useState([]);
    const [loadingReservations, setLoadingReservations] = useState(false);

    // 1. N'oublie pas d'importer l'email depuis ton contexte !
    const { userId, email, signOut } = useAuthContext();

    useEffect(() => {
        if (userId) { // On écoute userId maintenant
            fetchOwnerData();
        }
    }, [userId]);

    const fetchOwnerData = async () => {
        setLoading(true);
        try {
            // 2. On cherche l'utilisateur par son ID !
            const user = await apiFetch(`/users/${userId}`);

            if (!user) {
                throw new Error("Utilisateur introuvable");
            }

            setOwnerData(user);

            // ... le reste du code reste identique (récupération des factures, etc.)
            const personName = encodeURIComponent(`${user.firstname} ${user.lastname}`);
            const dataInvoices = await apiFetch(`/invoices?person=${personName}`);
            let fetchedInvoices = dataInvoices['hydra:member'] || dataInvoices.member || (Array.isArray(dataInvoices) ? dataInvoices : []);
            
            // On filtre pour exclure les factures d'achat classiques (qui commencent par FA-)
            // pour ne garder que les factures de rétribution créées manuellement
            fetchedInvoices = fetchedInvoices.filter(inv => !inv.title.toUpperCase().startsWith('FA-'));
            
            setInvoices(fetchedInvoices);

            // Calcul des gains en attente
            if (user.products && user.products.length > 0) {
                const queryParams = user.products.map(p => `products[]=/api/products/${p.id}`).join('&');
                const res = await apiFetch(`/reservations?${queryParams}`);
                const reservations = res['hydra:member'] || res.member || (Array.isArray(res) ? res : []);
                
                let earningsList = [];
                reservations.forEach(r => {
                    // Extract user ID from reservation to handle both IRI string and object
                    let rUserId = null;
                    if (typeof r.user === 'string') {
                        rUserId = r.user.split('/').pop();
                    } else if (r.user && r.user.id) {
                        rUserId = r.user.id.toString();
                    }

                    // Si c'est payé ET que ce n'est pas le proprio lui-même qui a réservé
                    if (r.isPaid && rUserId !== userId?.toString()) {
                        const productIri = r.products?.[0];
                        let pId = null;
                        if (typeof productIri === 'string') {
                            pId = parseInt(productIri.split('/').pop());
                        } else if (productIri && productIri.id) {
                            pId = productIri.id;
                        }
                        
                        const product = user.products.find(p => p.id === pId);
                        
                        if (product && r.startDate && r.endDate) {
                            const start = new Date(r.startDate);
                            const end = new Date(r.endDate);
                            const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));
                            const pricePerNight = (product.prices?.[0]?.price || 0) / 100;
                            
                            if (nights > 0 && pricePerNight > 0) {
                                const totalRent = nights * pricePerNight;
                                const retribution = totalRent * 0.35;
                                
                                earningsList.push({
                                    id: r.id,
                                    productName: product.title,
                                    startDate: start,
                                    endDate: end,
                                    nights,
                                    totalRent,
                                    retribution
                                });
                            }
                        }
                    }
                });
                
                earningsList.sort((a, b) => b.startDate - a.startDate);
                setPendingEarnings(earningsList);
            }

        } catch (error) {
            console.error("Erreur lors du chargement des données propriétaire :", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = async (product) => {
        setSelectedProduct(product);
        setBookingStartDate(null);
        setBookingEndDate(null);
        setBookingMessage(null);
        setLoadingReservations(true);

        try {
            // Fetch reservations for the selected product
            const res = await apiFetch(`/reservations?products=/api/products/${product.id}`);
            const reservations = res['hydra:member'] || res.member || (Array.isArray(res) ? res : []);
            setProductReservations(reservations);
        } catch (err) {
            console.error("Erreur lors du chargement des réservations du bien", err);
        } finally {
            setLoadingReservations(false);
        }
    };

    const handleReserveProperty = async (e) => {
        e.preventDefault();
        setBookingLoading(true);
        setBookingMessage(null);

        try {
            // Convert to format YYYY-MM-DD for the API
            const formatDate = (date) => {
                const d = new Date(date);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            };

            const payload = {
                startDate: formatDate(bookingStartDate),
                endDate: formatDate(bookingEndDate),
                nbAdult: 1,
                nbChildren: 0,
                user: `/api/users/${userId}`,
                products: [`/api/products/${selectedProduct.id}`],
                isPaid: true // Le propriétaire ne paye pas
            };

            await apiFetch('/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/ld+json'
                },
                body: JSON.stringify(payload)
            });

            setBookingMessage({ type: 'success', text: 'Période bloquée avec succès !' });
            // Réinitialiser après 3 secondes
            setTimeout(() => {
                setSelectedProduct(null);
                setBookingMessage(null);
                setBookingStartDate(null);
                setBookingEndDate(null);
            }, 3000);

        } catch (error) {
            console.error("Erreur lors de la réservation :", error);
            setBookingMessage({ type: 'error', text: "Erreur lors de l'enregistrement de la réservation." });
        } finally {
            setBookingLoading(false);
        }
    };

    const calculateContractDetails = (startDateString) => {
        if (!startDateString) return null;
        const start = new Date(startDateString);
        let end = new Date(start.getFullYear(), 9, 10); // 10 Octobre (months are 0-indexed, so 9 is October)
        
        // Si le contrat démarre après le 10 octobre, la saison de validité est celle de l'année suivante
        if (start > end) {
            end.setFullYear(end.getFullYear() + 1);
        }
        
        const today = new Date();
        const totalDays = (end - start) / (1000 * 60 * 60 * 24);
        const daysPassed = (today - start) / (1000 * 60 * 60 * 24);
        const remainingDays = Math.max(0, Math.ceil(totalDays - daysPassed));
        const progressPercent = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
        return { start, end, remainingDays, progressPercent };
    };

    if (loading) return <div className="p-10 text-center font-bold text-slate-400 animate-pulse">Chargement de votre espace... ⏳</div>;
    if (!ownerData) return <div className="p-10 text-center text-red-500 font-bold">Erreur : Impossible de charger vos données.</div>;

    const contract = calculateContractDetails(ownerData.contractDate);

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">

            {/* EN-TÊTE AVEC BOUTON DÉCONNEXION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Bonjour, {ownerData.firstname} 👋</h1>
                    <p className="text-slate-500 font-medium mt-2">Bienvenue dans votre espace propriétaire du Domaine L'Oasis.</p>
                </div>
                <button
                    onClick={signOut}
                    className="px-5 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center gap-2 border border-red-100"
                >
                    🚪 Déconnexion
                </button>
            </div>

            {/* Reste du code du Dashboard à l'identique... */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl">⏳</div>
                            <h2 className="text-2xl font-black text-slate-800">Mon Contrat de Location</h2>
                        </div>
                        {contract ? (
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm font-bold text-slate-500">
                                    <span>Début : {contract.start.toLocaleDateString('fr-FR')}</span>
                                    <span>Renouvellement : {contract.end.toLocaleDateString('fr-FR')}</span>
                                </div>
                                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${contract.remainingDays < 30 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${contract.progressPercent}%` }} />
                                </div>
                                <p className="text-right font-black text-lg text-slate-700">{contract.remainingDays} jours restants</p>
                            </div>
                        ) : (
                            <p className="text-slate-400 italic">Aucune date de contrat enregistrée.</p>
                        )}
                    </div>

                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-2xl">🏡</div>
                            <h2 className="text-2xl font-black text-slate-800">Mes Résidences & Parcelles</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {ownerData.products && ownerData.products.length > 0 ? (
                                ownerData.products.map(product => (
                                    <div key={product.id} className="border-2 border-slate-100 rounded-2xl p-5 hover:border-emerald-200 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-bold text-lg text-slate-800 leading-tight">{product.title}</h3>
                                            <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">Actif</span>
                                        </div>
                                        <p className="text-slate-500 text-sm mb-4 line-clamp-2">{product.description || 'Aucune description'}</p>
                                        <button 
                                            onClick={() => handleOpenModal(product)}
                                            className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors"
                                        >
                                            Bloquer des dates
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-400 italic col-span-full">Vous ne possédez aucun bien actuellement.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[2rem] p-8 shadow-xl text-white">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-white/10 text-emerald-400 rounded-xl flex items-center justify-center text-2xl">💰</div>
                        <h2 className="text-2xl font-black">Mes Rétributions</h2>
                    </div>
                    
                    <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl">
                        <button 
                            onClick={() => setActiveTab('pending')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'pending' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            Gains de la saison
                        </button>
                        <button 
                            onClick={() => setActiveTab('invoices')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'invoices' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            Factures officielles
                        </button>
                    </div>

                    <div className="space-y-3">
                        {activeTab === 'pending' && (
                            <>
                                <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                                    <p className="text-emerald-400 text-sm font-bold uppercase tracking-wider mb-1">Total estimé</p>
                                    <p className="text-3xl font-black text-white">{pendingEarnings.reduce((acc, e) => acc + e.retribution, 0).toFixed(2)} €</p>
                                    <p className="text-slate-400 text-xs mt-2">Soit 35% des locations générées par le camping.</p>
                                </div>
                                {pendingEarnings.length > 0 ? (
                                    pendingEarnings.map(earning => (
                                        <div key={earning.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-white text-sm">{earning.productName}</h4>
                                                <span className="text-emerald-400 font-black">+{earning.retribution.toFixed(2)} €</span>
                                            </div>
                                            <p className="text-xs text-slate-400 mb-1">{earning.startDate.toLocaleDateString('fr-FR')} - {earning.endDate.toLocaleDateString('fr-FR')} ({earning.nights} nuits)</p>
                                            <p className="text-xs text-slate-500 italic">Loyer brut : {earning.totalRent.toFixed(2)} €</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 bg-white/5 rounded-2xl border border-dashed border-white/20">
                                        <span className="text-3xl block mb-2">🏖️</span>
                                        <p className="text-slate-400 font-medium text-sm">Aucune location pour le moment.</p>
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === 'invoices' && (
                            <>
                                {invoices.length > 0 ? (
                                    invoices.map(invoice => (
                                        <div key={invoice.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center hover:bg-white/10 transition-colors">
                                            <div>
                                                <h4 className="font-bold text-emerald-400">{invoice.title}</h4>
                                                <p className="text-xs text-slate-400">{new Date(invoice.createdAt).toLocaleDateString('fr-FR')}</p>
                                            </div>
                                            <button onClick={() => window.open(invoice.path, '_blank')} disabled={!invoice.path || invoice.path === 'generation_en_attente'} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-30" title="Télécharger la facture">📥</button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 bg-white/5 rounded-2xl border border-dashed border-white/20">
                                        <span className="text-3xl block mb-2">📉</span>
                                        <p className="text-slate-400 font-medium text-sm">Aucune facture générée.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL DE RÉSERVATION */}
            {selectedProduct && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button 
                            onClick={() => { setSelectedProduct(null); setBookingMessage(null); }}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                        >
                            ✕
                        </button>
                        
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl">📅</div>
                            <h3 className="text-xl font-black text-slate-800">Bloquer des dates</h3>
                        </div>
                        
                        <p className="text-slate-500 text-sm mb-6">
                            Sélectionnez les dates pour lesquelles vous souhaitez bloquer <strong>{selectedProduct.title}</strong> pour votre usage personnel.
                        </p>

                        {bookingMessage && (
                            <div className={`p-4 rounded-xl mb-6 font-bold text-sm ${bookingMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                {bookingMessage.text}
                            </div>
                        )}

                        {loadingReservations ? (
                            <div className="flex flex-col items-center justify-center py-10 space-y-4">
                                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-slate-500 font-medium animate-pulse">Chargement du calendrier...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleReserveProperty} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Date d'arrivée</label>
                                    <DatePicker 
                                        selected={bookingStartDate}
                                        onChange={(date) => {
                                            setBookingStartDate(date);
                                            if (bookingEndDate && date > bookingEndDate) {
                                                setBookingEndDate(null);
                                            }
                                        }}
                                        selectsStart
                                        startDate={bookingStartDate}
                                        endDate={bookingEndDate}
                                        minDate={(() => {
                                            const today = new Date();
                                            today.setHours(0,0,0,0);
                                            const opening = new Date(today.getFullYear(), 4, 5); // 5 Mai
                                            return today > opening ? today : opening;
                                        })()}
                                        maxDate={new Date(new Date().getFullYear(), 9, 10)} // 10 Octobre
                                        excludeDates={productReservations.reduce((acc, res) => {
                                            if (!res.startDate || !res.endDate) return acc;
                                            const start = new Date(res.startDate);
                                            const end = new Date(res.endDate);
                                            let current = new Date(start);
                                            while (current <= end) {
                                                acc.push(new Date(current));
                                                current.setDate(current.getDate() + 1);
                                            }
                                            return acc;
                                        }, [])}
                                        dateFormat="dd/MM/yyyy"
                                        placeholderText="Sélectionnez une date"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 bg-slate-50 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Date de départ</label>
                                    <DatePicker 
                                        selected={bookingEndDate}
                                        onChange={(date) => setBookingEndDate(date)}
                                        selectsEnd
                                        startDate={bookingStartDate}
                                        endDate={bookingEndDate}
                                        minDate={bookingStartDate || (() => {
                                            const today = new Date();
                                            today.setHours(0,0,0,0);
                                            const opening = new Date(today.getFullYear(), 4, 5);
                                            return today > opening ? today : opening;
                                        })()}
                                        maxDate={new Date(new Date().getFullYear(), 9, 10)}
                                        excludeDates={productReservations.reduce((acc, res) => {
                                            if (!res.startDate || !res.endDate) return acc;
                                            const start = new Date(res.startDate);
                                            const end = new Date(res.endDate);
                                            let current = new Date(start);
                                            while (current <= end) {
                                                acc.push(new Date(current));
                                                current.setDate(current.getDate() + 1);
                                            }
                                            return acc;
                                        }, [])}
                                        dateFormat="dd/MM/yyyy"
                                        placeholderText="Sélectionnez une date"
                                        required
                                        disabled={!bookingStartDate}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 bg-slate-50 outline-none focus:border-emerald-500 focus:bg-white transition-all disabled:opacity-50"
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={bookingLoading || !bookingStartDate || !bookingEndDate}
                                    className="w-full mt-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                    {bookingLoading ? 'Enregistrement... ⏳' : 'Confirmer la période'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerDashboard;
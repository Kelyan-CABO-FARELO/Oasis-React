import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../services/api';
import { useAuthContext } from '../../contexts/AuthContext.jsx';

// STRIPE 💳
import { loadStripe } from '@stripe/stripe-js';

// COMPOSANTS EXTRAITS 🧩
import RetributionsGrid from '../../components/Owner/RetributionsGrid.jsx';
import BlockDatesModal from '../../components/Owner/BlockDatesModal.jsx';
import RenewContractModal from '../../components/Owner/RenewContractModal.jsx';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const OwnerDashboard = () => {
    const [ownerData, setOwnerData] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [pendingEarnings, setPendingEarnings] = useState([]);
    const [blockedPeriods, setBlockedPeriods] = useState([]);
    const [loading, setLoading] = useState(true);

    // États modale de réservation / blocage de dates
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [bookingStartDate, setBookingStartDate] = useState(null);
    const [bookingEndDate, setBookingEndDate] = useState(null);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingMessage, setBookingMessage] = useState(null);
    
    // Réservations pour blocage calendrier
    const [productReservations, setProductReservations] = useState([]);
    const [loadingReservations, setLoadingReservations] = useState(false);

    // États renouvellement de contrat
    const [renewingProduct, setRenewingProduct] = useState(null);
    const [renewDuration, setRenewDuration] = useState(1);
    const [renewClientSecret, setRenewClientSecret] = useState('');
    const [renewLoading, setRenewLoading] = useState(false);
    const [renewStep, setRenewStep] = useState(1);

    const { userId, signOut } = useAuthContext();

    useEffect(() => {
        if (userId) {
            fetchOwnerData();
        }
    }, [userId]);

    const fetchOwnerData = async () => {
        setLoading(true);
        try {
            const user = await apiFetch(`/users/${userId}`);
            if (!user) throw new Error("Utilisateur introuvable");
            setOwnerData(user);

            const personName = encodeURIComponent(`${user.firstname} ${user.lastname}`);
            const dataInvoices = await apiFetch(`/invoices?person=${personName}`);
            let fetchedInvoices = dataInvoices['hydra:member'] || dataInvoices.member || (Array.isArray(dataInvoices) ? dataInvoices : []);
            
            // Exclure les factures classiques (FA-) pour ne garder que les factures de rétribution
            fetchedInvoices = fetchedInvoices.filter(inv => !inv.title.toUpperCase().startsWith('FA-'));
            setInvoices(fetchedInvoices);

            // Calcul des gains en attente & récupération des séjours privés
            if (user.products && user.products.length > 0) {
                const queryParams = user.products.map(p => `products[]=/api/products/${p.id}`).join('&');
                const res = await apiFetch(`/reservations?${queryParams}`);
                const reservations = res['hydra:member'] || res.member || (Array.isArray(res) ? res : []);
                
                let earningsList = [];
                let blockedList = [];
                reservations.forEach(r => {
                    let rUserId = null;
                    if (typeof r.user === 'string') {
                        rUserId = r.user.split('/').pop();
                    } else if (r.user && r.user.id) {
                        rUserId = r.user.id.toString();
                    }

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

                        if (rUserId === userId?.toString()) {
                            // Période bloquée par le propriétaire
                            blockedList.push({
                                id: r.id,
                                productName: product.title,
                                startDate: start,
                                endDate: end,
                                nights
                            });
                        } else if (r.isPaid) {
                            // Séjour d'un locataire payé
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
                blockedList.sort((a, b) => b.startDate - a.startDate);
                setPendingEarnings(earningsList);
                setBlockedPeriods(blockedList);
            }
        } catch (error) {
            console.error("Erreur chargement données proprio :", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnblockPeriod = async (reservationId) => {
        if (!window.confirm("Voulez-vous vraiment débloquer cette période ? Votre résidence redeviendra immédiatement louable pour les vacanciers.")) {
            return;
        }
        try {
            await apiFetch(`/manage-booking/${reservationId}/cancel`, {
                method: 'DELETE'
            });
            alert("✅ Période débloquée avec succès !");
            fetchOwnerData();
        } catch (error) {
            console.error("Erreur lors du déblocage :", error);
            alert("Erreur lors du déblocage.");
        }
    };

    const handleOpenModal = async (product) => {
        setSelectedProduct(product);
        setBookingStartDate(null);
        setBookingEndDate(null);
        setBookingMessage(null);
        setLoadingReservations(true);

        try {
            const res = await apiFetch(`/reservations?products=/api/products/${product.id}`);
            const reservations = res['hydra:member'] || res.member || (Array.isArray(res) ? res : []);
            setProductReservations(reservations);
        } catch (err) {
            console.error("Erreur chargement réservations bien :", err);
        } finally {
            setLoadingReservations(false);
        }
    };

    const handleReserveProperty = async (e) => {
        e.preventDefault();
        setBookingLoading(true);
        setBookingMessage(null);

        try {
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
                isPaid: true
            };

            await apiFetch('/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/ld+json' },
                body: JSON.stringify(payload)
            });

            setBookingMessage({ type: 'success', text: 'Période bloquée avec succès !' });
            setTimeout(() => {
                setSelectedProduct(null);
                setBookingMessage(null);
                setBookingStartDate(null);
                setBookingEndDate(null);
            }, 3000);
        } catch (error) {
            console.error("Erreur lors du blocage :", error);
            setBookingMessage({ type: 'error', text: "Erreur lors de l'enregistrement." });
        } finally {
            setBookingLoading(false);
        }
    };

    const startContractRenewal = (product) => {
        setRenewingProduct(product);
        setRenewDuration(1);
        setRenewClientSecret('');
        setRenewStep(1);
    };

    const handleCreateRenewalPayment = async () => {
        setRenewLoading(true);
        try {
            const data = await apiFetch(`/products/${renewingProduct.id}/renew-contract`, {
                method: 'POST',
                body: JSON.stringify({ duration: renewDuration })
            });
            setRenewClientSecret(data.clientSecret);
            setRenewStep(2);
        } catch (e) {
            alert(e.message || "Erreur de connexion.");
        } finally {
            setRenewLoading(false);
        }
    };

    const closeRenewalModal = () => {
        setRenewingProduct(null);
        setRenewDuration(1);
        setRenewClientSecret('');
        setRenewStep(1);
    };

    const calculateContractDetails = (startDateString, durationSeasons = 1) => {
        if (!startDateString) return null;
        const start = new Date(startDateString);
        let end = new Date(start.getFullYear(), 9, 10);
        
        if (start > end) {
            end.setFullYear(end.getFullYear() + 1);
        }
        if (durationSeasons > 1) {
            end.setFullYear(end.getFullYear() + (durationSeasons - 1));
        }
        
        const today = new Date();
        const totalDays = (end - start) / (1000 * 60 * 60 * 24);
        const daysPassed = (today - start) / (1000 * 60 * 60 * 24);
        const remainingDays = Math.max(0, Math.ceil(totalDays - daysPassed));
        const progressPercent = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
        return { start, end, remainingDays, progressPercent };
    };

    const getProductContract = (product) => {
        const date = product.contractDate || ownerData?.contractDate;
        const duration = product.duration || 1;
        return calculateContractDetails(date, duration);
    };

    if (loading) return <div className="p-10 text-center font-bold text-slate-400 animate-pulse">Chargement de votre espace... ⏳</div>;
    if (!ownerData) return <div className="p-10 text-center text-red-500 font-bold">Erreur : Impossible de charger vos données.</div>;

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

            {/* CONTENU PRINCIPAL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-2xl">🏡</div>
                            <h2 className="text-2xl font-black text-slate-800">Mes Résidences & Parcelles</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {ownerData.products && ownerData.products.length > 0 ? (
                                ownerData.products.map(product => {
                                    const pContract = getProductContract(product);
                                    return (
                                        <div key={product.id} className="border-2 border-slate-100 rounded-3xl p-6 hover:border-emerald-250 hover:shadow-xl hover:shadow-slate-100/50 transition-all flex flex-col justify-between bg-white">
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-black text-xl text-slate-800 leading-tight">{product.title}</h3>
                                                    {pContract && pContract.remainingDays > 0 ? (
                                                        <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">Actif</span>
                                                    ) : (
                                                        <span className="bg-red-100 text-red-700 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">Expiré</span>
                                                    )}
                                                </div>
                                                <p className="text-slate-500 text-sm mb-6 line-clamp-2">{product.description || 'Aucune description'}</p>
                                                
                                                {pContract ? (
                                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 space-y-3">
                                                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest flex justify-between">
                                                            <span>Contrat de location</span>
                                                            <span className="text-slate-600 font-bold lowercase">{product.duration || 1} saison(s)</span>
                                                        </div>
                                                        <div className="flex justify-between text-xs font-bold text-slate-500">
                                                            <span>Début : {pContract.start.toLocaleDateString('fr-FR')}</span>
                                                            <span>Fin : {pContract.end.toLocaleDateString('fr-FR')}</span>
                                                        </div>
                                                        <div className="w-full h-2.5 bg-slate-200/60 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full transition-all duration-1000 ${pContract.remainingDays < 30 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${pContract.progressPercent}%` }} />
                                                        </div>
                                                        <p className="text-right font-black text-xs text-slate-600">{pContract.remainingDays} jours restants</p>
                                                    </div>
                                                ) : (
                                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 text-center text-slate-400 text-xs italic">
                                                        Aucun contrat associé à ce bien.
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-3 mt-2">
                                                <button 
                                                    onClick={() => handleOpenModal(product)}
                                                    className="py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2 border border-slate-100"
                                                >
                                                    📅 Bloquer dates
                                                </button>
                                                <button 
                                                    onClick={() => startContractRenewal(product)}
                                                    className="py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2 border border-emerald-100"
                                                >
                                                    🔄 Renouveler
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-slate-400 italic col-span-full">Vous ne possédez aucun bien actuellement.</p>
                            )}
                        </div>
                    </div>

                    {/* MES PÉRIODES BLOQUÉES (SÉJOURS PRIVÉS) */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mt-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-2xl">🔒</div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-800">Mes Séjours Privés & Blocages</h2>
                                <p className="text-slate-400 text-xs font-semibold">Périodes réservées pour votre usage personnel</p>
                            </div>
                        </div>

                        {blockedPeriods.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {blockedPeriods.map(period => (
                                    <div key={period.id} className="border border-slate-150 rounded-2xl p-4 flex flex-col justify-between bg-slate-50/50 hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all">
                                        <div>
                                            <h3 className="font-black text-base text-slate-800">{period.productName}</h3>
                                            <p className="text-slate-500 text-xs font-bold mt-1">
                                                📅 Du {period.startDate.toLocaleDateString('fr-FR')} au {period.endDate.toLocaleDateString('fr-FR')}
                                            </p>
                                            <p className="text-slate-400 text-[10px] italic mt-0.5">({period.nights} nuitées privées)</p>
                                        </div>
                                        <button
                                            onClick={() => handleUnblockPeriod(period.id)}
                                            className="mt-4 w-full py-2 bg-red-50 hover:bg-red-100 text-red-650 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 border border-red-100"
                                        >
                                            🔓 Débloquer la période
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-400 text-sm italic">Vous n'avez bloqué aucune période personnelle pour le moment.</p>
                        )}
                    </div>
                </div>

                {/* COLONNE COMPTE & SUPPORT */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl">👤</div>
                            <h3 className="text-xl font-black text-slate-800">Mon Compte</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <span className="text-xs font-bold text-slate-400 block">Propriétaire</span>
                                <span className="font-bold text-slate-700">{ownerData.firstname} {ownerData.lastname}</span>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-400 block">E-mail de contact</span>
                                <span className="font-bold text-slate-700 truncate block">{ownerData.email}</span>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-400 block">Date d'adhésion</span>
                                <span className="font-bold text-slate-700">
                                    {ownerData.contractDate ? new Date(ownerData.contractDate).toLocaleDateString('fr-FR') : 'Non renseignée'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2rem] p-8 text-white shadow-lg shadow-orange-200">
                        <h3 className="text-xl font-black mb-2">Besoin d'aide ? ☀️</h3>
                        <p className="text-sm opacity-90 mb-6">Notre équipe technique et administrative est disponible à l'accueil ou par e-mail.</p>
                        <a href="mailto:contact.cf@loasis.com" className="w-full py-3 bg-white/20 hover:bg-white/30 transition-all rounded-xl font-bold flex items-center justify-center gap-2 backdrop-blur-sm text-center">
                            ✉️ contact.cf@loasis.com
                        </a>
                    </div>
                </div>
            </div>

            {/* RÉTRIBUTIONS PAR PROPRIÉTÉ EN PLEINE LARGEUR */}
            <RetributionsGrid 
                products={ownerData.products} 
                pendingEarnings={pendingEarnings} 
                invoices={invoices} 
            />

            {/* MODAL DE RÉSERVATION */}
            {selectedProduct && (
                <BlockDatesModal 
                    selectedProduct={selectedProduct}
                    onClose={() => { setSelectedProduct(null); setBookingMessage(null); }}
                    bookingStartDate={bookingStartDate}
                    setBookingStartDate={setBookingStartDate}
                    bookingEndDate={bookingEndDate}
                    setBookingEndDate={setBookingEndDate}
                    bookingLoading={bookingLoading}
                    bookingMessage={bookingMessage}
                    handleReserveProperty={handleReserveProperty}
                    loadingReservations={loadingReservations}
                    productReservations={productReservations}
                />
            )}

            {/* MODAL DE RENOUVELLEMENT DE CONTRAT */}
            {renewingProduct && (
                <RenewContractModal 
                    renewingProduct={renewingProduct}
                    closeRenewalModal={closeRenewalModal}
                    renewDuration={renewDuration}
                    setRenewDuration={setRenewDuration}
                    renewStep={renewStep}
                    setRenewStep={setRenewStep}
                    renewClientSecret={renewClientSecret}
                    handleCreateRenewalPayment={handleCreateRenewalPayment}
                    renewLoading={renewLoading}
                    stripePromise={stripePromise}
                />
            )}
        </div>
    );
};

export default OwnerDashboard;
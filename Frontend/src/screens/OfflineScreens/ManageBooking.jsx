import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Navigate, useNavigate } from 'react-router-dom';
import { API_ROOT } from '../../constants/apiConstant.js'; // 👈 NOUVEL IMPORT

const ManageBooking = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    if (!token) {
        return <Navigate to="/" replace />;
    }

    const [booking, setBooking] = useState(null);
    const [error, setError] = useState(null);
    const [isAddingPool, setIsAddingPool] = useState(false);
    const [poolDays, setPoolDays] = useState(1);

    useEffect(() => {
        // 👇 CORRECTION : Ajout de API_ROOT et /api/
        fetch(`${API_ROOT}/api/manage-booking/${id}?token=${token}`)
            .then(response => {
                if (!response.ok) throw new Error("Ce lien magique est invalide, expiré, ou ne vous appartient pas.");
                return response.json();
            })
            .then(data => setBooking(data))
            .catch(err => setError(err.message));
    }, [id, token]);

    let nights = 1;
    if (booking) {
        const [d1, m1, y1] = booking.startDate.split('/');
        const [d2, m2, y2] = booking.endDate.split('/');
        const dStart = new Date(`${y1}-${m1}-${d1}`);
        const dEnd = new Date(`${y2}-${m2}-${d2}`);
        nights = Math.max(1, Math.ceil((dEnd - dStart) / (1000 * 60 * 60 * 24)));
    }

    const handleCancelBooking = async () => {
        const isConfirmed = window.confirm("⚠️ Êtes-vous sûr de vouloir annuler ce séjour ? Cette action est irréversible.");
        if (isConfirmed) {
            try {
                // 👇 CORRECTION : Ajout de API_ROOT et /api/
                const response = await fetch(`${API_ROOT}/api/manage-booking/${id}/cancel?token=${token}`, { method: 'DELETE' });
                if (!response.ok) throw new Error("Erreur lors de l'annulation.");
                alert("Votre réservation a été annulée et supprimée de nos systèmes.");
                navigate('/');
            } catch (err) {
                alert(err.message);
            }
        }
    };

    const submitPoolOption = async () => {
        const isConfirmed = window.confirm(`Valider l'accès piscine pour ${poolDays} jour(s) ?\nLe règlement se fera à la réception.`);
        if (isConfirmed) {
            try {
                const response = await fetch(`${API_ROOT}/api/manage-booking/${id}/add-pool?token=${token}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ poolDays: Number(poolDays) })
                });

                if (!response.ok) throw new Error("Erreur lors de l'ajout de l'option.");
                const data = await response.json();

                alert(`✅ ${data.message}`);
                window.location.reload();
            } catch (err) {
                alert(err.message);
            }
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-[#fffdf0] flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white p-10 rounded-[2rem] shadow-xl max-w-md border border-red-100">
                    <div className="text-6xl mb-6">🛑</div>
                    <h1 className="text-2xl font-black text-slate-900 mb-4">Accès Refusé</h1>
                    <p className="text-slate-600 mb-8 font-medium">{error}</p>
                    <button onClick={() => navigate('/')} className="w-full px-6 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg">Retourner à l'accueil</button>
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-[#fffdf0] flex items-center justify-center">
                <div className="text-xl font-bold text-amber-600 animate-pulse">Ouverture de votre dossier sécurisé... 🔐</div>
            </div>
        );
    }

    return (
        <div className=" mt-10 min-h-screen bg-[#fffdf0] py-12 px-6">
            <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">

                <h1 className="text-4xl font-black text-slate-900 mb-2">Bonjour {booking.user?.firstname} 👋</h1>
                <p className="text-lg text-slate-500 mb-8 font-medium">
                    Espace de gestion de votre réservation <span className="text-amber-500 font-bold">#{booking.id}</span>
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl border border-slate-100">
                            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">🏕️ Votre Hébergement</h2>

                            {booking.products && booking.products.length > 0 ? (
                                booking.products.map((prod, idx) => (
                                    <div key={idx} className="bg-amber-50 border border-amber-200 p-5 rounded-2xl mb-8 shadow-sm">
                                        <p className="text-xl font-bold text-amber-700">{prod}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-slate-50 p-5 rounded-2xl mb-8 border border-slate-200">
                                    <p className="text-slate-500 italic">Aucun hébergement spécifié.</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Arrivée</p>
                                    <p className="text-base md:text-lg font-bold text-slate-700">{booking.startDate}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Départ</p>
                                    <p className="text-base md:text-lg font-bold text-slate-700">{booking.endDate}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 col-span-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Voyageurs</p>
                                    <p className="text-base md:text-lg font-bold text-slate-700">{booking.nbAdult} Adulte(s), {booking.nbChildren} Enfant(s)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
                            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">⚙️ Gestion</h2>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                                    <span className="font-bold text-slate-600">Paiement</span>
                                    <span className={booking.isPaid ? 'px-3 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-lg' : 'px-3 py-1 bg-amber-100 text-amber-700 font-bold rounded-lg'}>
                                        {booking.isPaid ? 'Validé' : 'En attente'}
                                    </span>
                                </div>

                                {booking.invoicePath && booking.invoicePath !== 'generation_en_attente' ? (
                                    <a
                                        href={`${API_ROOT}${booking.invoicePath}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-bold transition-all flex items-center justify-center gap-3 shadow-sm border border-emerald-100"
                                    >
                                        📥 Télécharger ma facture (PDF)
                                    </a>
                                ) : (
                                    <button
                                        disabled
                                        className="w-full py-4 bg-slate-100 text-slate-400 rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-3 shadow-sm"
                                    >
                                        📥 Facture en cours de génération...
                                    </button>
                                )}

                                {!isAddingPool ? (
                                    <button onClick={() => setIsAddingPool(true)} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-3 shadow-sm">
                                        🏊‍♂️ Ajouter des options
                                    </button>
                                ) : (
                                    <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-4 mt-4 animate-in fade-in zoom-in duration-300">
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-800 flex items-center gap-2">
                                                <span className="text-xl">🏊‍♂️</span> Accès Espace Aquatique
                                            </p>
                                            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 mt-3">
                                                <label className="text-sm font-bold text-slate-600">Jours d'accès :</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={nights}
                                                    value={poolDays}
                                                    onChange={(e) => setPoolDays(Math.min(nights, Math.max(1, e.target.value)))}
                                                    className="w-16 p-2 text-center font-bold border border-slate-300 rounded-lg outline-none focus:border-emerald-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-4">
                                            <button onClick={submitPoolOption} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold transition-all text-sm">Confirmer</button>
                                            <button onClick={() => setIsAddingPool(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold transition-all text-sm">Annuler</button>
                                        </div>
                                    </div>
                                )}

                                <hr className="border-slate-100 my-6" />

                                <button onClick={handleCancelBooking} className="w-full py-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold transition-all flex items-center justify-center gap-3 border border-red-100">
                                    ❌ Annuler le séjour
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageBooking;
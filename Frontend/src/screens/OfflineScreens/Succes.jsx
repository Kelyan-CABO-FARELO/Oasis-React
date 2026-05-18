import React from 'react';
import {Navigate, useLocation, useNavigate} from 'react-router-dom';

const Success = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // On récupère l'ID de la réservation passé par le Checkout
    const reservationId = location.state?.reservationId;

    // 🛑 LA SÉCURITÉ : Si on arrive ici sans ID de réservation, on expulse vers l'accueil !
    if (!reservationId) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="min-h-screen bg-[#fffdf0] p-6 flex flex-col items-center justify-center text-center">
            <div className="max-w-xl bg-white rounded-[3rem] shadow-2xl p-12 border border-emerald-100">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 animate-bounce">
                    🎉
                </div>
                <h1 className="text-4xl font-black text-slate-900 mb-4">Paiement validé !</h1>
                <p className="text-lg text-slate-600 mb-8 font-medium">
                    Merci pour votre confiance. Votre réservation
                    {reservationId && <span className="font-bold text-amber-600"> n°{reservationId} </span>}
                    au Domaine L'Oasis est confirmée.
                </p>

                <div className="bg-amber-50 p-6 rounded-2xl mb-8">
                    <p className="text-sm text-slate-700">
                        Un email de confirmation contenant vos identifiants de suivi vient de vous être envoyé.
                        Vous pourrez vous connecter à tout moment pour modifier vos options.
                    </p>
                </div>

                <button
                    onClick={() => navigate('/')}
                    className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg transition-all"
                >
                    Retour à l'accueil
                </button>
            </div>
        </div>
    );
};

export default Success;
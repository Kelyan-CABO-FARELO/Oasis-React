import React, { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { apiFetch } from '../../services/api';

const StripePaymentForm = ({ amount, onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsProcessing(true);
        setErrorMessage(null);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: 'if_required',
        });

        if (error) {
            setErrorMessage(error.message);
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            onSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <PaymentElement />
            </div>

            {errorMessage && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl font-bold text-sm">
                    {errorMessage}
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-700 disabled:opacity-50 transition-all flex justify-center items-center gap-3 text-lg"
            >
                {isProcessing ? 'Validation...' : `Régler ${amount} €`}
            </button>
        </form>
    );
};

const RenewContractModal = ({
    renewingProduct,
    closeRenewalModal,
    renewDuration,
    setRenewDuration,
    renewStep,
    setRenewStep,
    renewClientSecret,
    handleCreateRenewalPayment,
    renewLoading,
    stripePromise
}) => {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] p-8 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
                <button 
                    onClick={closeRenewalModal}
                    className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-full transition-colors font-bold"
                >
                    ✕
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl">🔄</div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Renouvellement</h3>
                        <p className="text-slate-400 text-sm font-medium">{renewingProduct.title}</p>
                    </div>
                </div>

                {renewStep === 1 && (
                    <div className="space-y-6">
                        <p className="text-slate-500 font-medium leading-relaxed">
                            Vous pouvez prolonger la validité de votre contrat de location à tout moment. Choisissez la durée de prolongation :
                        </p>

                        <div className="grid grid-cols-1 gap-4">
                            <label className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${renewDuration === 1 ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-150 hover:border-slate-305'}`}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-black text-slate-800 text-lg flex items-center gap-2">
                                        <input type="radio" name="renew_dur" checked={renewDuration === 1} onChange={() => setRenewDuration(1)} className="accent-emerald-600 w-5 h-5" />
                                        1 Saison Supplémentaire
                                    </span>
                                    <span className="font-black text-emerald-600 text-xl">500 €</span>
                                </div>
                                <p className="text-xs text-slate-400 font-bold ml-7">
                                    Prolonge votre contrat d'une saison complète (jusqu'au 10 octobre).
                                </p>
                            </label>

                            <label className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${renewDuration === 2 ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-150 hover:border-slate-305'}`}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-black text-slate-800 text-lg flex items-center gap-2">
                                        <input type="radio" name="renew_dur" checked={renewDuration === 2} onChange={() => setRenewDuration(2)} className="accent-emerald-600 w-5 h-5" />
                                        2 Saisons Supplémentaires
                                    </span>
                                    <span className="font-black text-emerald-600 text-xl">900 €</span>
                                </div>
                                <p className="text-xs text-slate-400 font-bold ml-7">
                                    Économisez 100 € ! Prolonge votre contrat de 2 saisons complètes.
                                </p>
                            </label>
                        </div>

                        <button
                            onClick={handleCreateRenewalPayment}
                            disabled={renewLoading}
                            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl shadow-xl transition-all disabled:opacity-50 text-center"
                        >
                            {renewLoading ? 'Préparation du paiement...' : 'Passer au paiement sécurisé'}
                        </button>
                    </div>
                )}

                {renewStep === 2 && renewClientSecret && (
                    <div className="space-y-6">
                        <p className="text-slate-500 font-medium">
                            Veuillez saisir vos coordonnées bancaires pour finaliser le renouvellement ({renewDuration === 1 ? '500 €' : '900 €'}) :
                        </p>

                        <Elements stripe={stripePromise} options={{ clientSecret: renewClientSecret, appearance: { theme: 'stripe' } }}>
                            <StripePaymentForm 
                                amount={renewDuration === 1 ? 500 : 900}
                                onSuccess={async () => {
                                    try {
                                        await apiFetch(`/products/${renewingProduct.id}/confirm-renewal`, { 
                                            method: 'POST',
                                            body: JSON.stringify({ duration: renewDuration })
                                        });
                                        alert("✅ Votre contrat a été renouvelé avec succès ! La facture officielle a été émise et est disponible dans votre espace.");
                                    } catch (e) {
                                        console.error(e);
                                    } finally {
                                        window.location.reload();
                                    }
                                }}
                            />
                        </Elements>

                        <button onClick={() => setRenewStep(1)} className="w-full text-center text-sm font-bold text-slate-400 hover:text-slate-650">
                            Retour aux choix
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RenewContractModal;

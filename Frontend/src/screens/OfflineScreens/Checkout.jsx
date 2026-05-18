import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useBookingContext } from "../../contexts/BookingContext.jsx";
import { reservationService } from "../../services/reservationService.js";
import ErrorMessage from "../../components/UI/ErrorMessage.jsx";
import StripeCardElement from "../../components/Checkout/StripeCardElement.jsx";

// Initialisation de Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const location = useLocation();
    const navigate = useNavigate();
    const { searchParams, poolOptions } = useBookingContext();

    const grandTotal = location.state?.grandTotal;
    const productId = location.state?.productId;

    const [formData, setFormData] = useState({
        firstname: '', lastname: '', email: '', mobile: '', consentDataRetention: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsSubmitting(true);
        setError(null);

        const payload = {
            user: formData,
            reservation: {
                productId: Number(productId),
                startDate: searchParams.startDate,
                endDate: searchParams.endDate,
                nbAdults: Number(searchParams.nbAdults),
                nbChildren: Number(searchParams.nbChildren),
                wantsPool: poolOptions.wantsPool,
                poolDays: poolOptions.wantsPool ? poolOptions.poolDays : 0
            }
        };

        try {
            // 1. Appel à Symfony pour créer le compte et récupérer le clientSecret
            const response = await reservationService.createGuestReservation(payload);

            // 2. Confirmation du paiement avec Stripe
            const result = await stripe.confirmCardPayment(response.clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                    billing_details: {
                        name: `${formData.firstname} ${formData.lastname}`,
                        email: formData.email,
                    },
                }
            });

            if (result.error) {
                setError(result.error.message);
                setIsSubmitting(false);
            } else if (result.paymentIntent.status === 'succeeded') {
                // 3. Redirection vers une page de succès (à créer)
                navigate('/success', { state: { reservationId: response.id } });
            }
        } catch (err) {
            setError(err.message || "Une erreur est survenue.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fffdf0] p-6 md:p-12 flex items-center justify-center pb-24">
            <div className="max-w-3xl w-full bg-white rounded-[2rem] shadow-2xl p-8 md:p-12 border border-amber-50">
                <button onClick={() => navigate(-1)} className="mb-6 font-bold text-slate-400 hover:text-amber-600 transition-colors">
                    ← Retour
                </button>

                <h1 className="text-4xl font-black text-slate-900 mb-8">Paiement sécurisé 💳</h1>

                {error && <div className="mb-6"><ErrorMessage message={error} /></div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input type="text" name="firstname" value={formData.firstname} onChange={handleChange} required className="px-4 py-3 rounded-xl border-2 border-slate-100 bg-slate-50 outline-none" placeholder="Prénom" />
                        <input type="text" name="lastname" value={formData.lastname} onChange={handleChange} required className="px-4 py-3 rounded-xl border-2 border-slate-100 bg-slate-50 outline-none" placeholder="Nom" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="px-4 py-3 rounded-xl border-2 border-slate-100 bg-slate-50 outline-none" placeholder="Email" />
                        <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} required className="px-4 py-3 rounded-xl border-2 border-slate-100 bg-slate-50 outline-none" placeholder="Téléphone" />
                    </div>

                    {/* Ton composant de carte Stripe */}
                    <StripeCardElement />

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <label className="flex items-start gap-4 cursor-pointer text-sm">
                            <input type="checkbox" name="consentDataRetention" checked={formData.consentDataRetention} onChange={handleChange} className="w-5 h-5 accent-amber-500" />
                            <span>J'accepte la conservation de mes données pendant 1 an (RGPD).</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !stripe}
                        className={`w-full py-5 bg-emerald-500 text-white font-black text-xl rounded-2xl shadow-lg transition-all ${isSubmitting ? 'opacity-50' : 'hover:-translate-y-1'}`}
                    >
                        {isSubmitting ? 'Validation...' : `Payer ${grandTotal?.toFixed(2)} €`}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Wrapper obligatoire pour fournir le contexte Stripe
const Checkout = () => (
    <Elements stripe={stripePromise}>
        <CheckoutForm />
    </Elements>
);

export default Checkout;
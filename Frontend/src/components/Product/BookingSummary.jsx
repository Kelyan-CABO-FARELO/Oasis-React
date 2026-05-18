import React from 'react';
import { useBookingContext } from "../../contexts/BookingContext.jsx";
import {useNavigate} from "react-router-dom";

const BookingSummary = ({
                            productId, nights, basePrice, rawAccommodation,
                            lowSeasonNights, highSeasonNights,
                            discountMultiplier, discountAmount,
                            totalTaxes, extras, totalPool, grandTotal
                        }) => {
    const navigate = useNavigate();
    const { searchParams, poolOptions } = useBookingContext();
    const adults = Number(searchParams.nbAdults) || 0;
    const children = Number(searchParams.nbChildren) || 0;

    return (
        <div className="bg-amber-50/80 rounded-[2rem] shadow-2xl p-8 md:p-10 border border-amber-200 sticky top-10">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Récapitulatif de séjour</h2>

            <div className="space-y-4 mb-6 text-slate-700 font-medium">
                {/* DÉTAIL DE L'HÉBERGEMENT */}
                <div className="pb-4 border-b border-amber-200/50">
                    <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-slate-800">Hébergement ({nights} nuits)</span>
                        <span className="font-bold text-slate-800">{rawAccommodation.toFixed(2)} €</span>
                    </div>
                    <div className="text-sm text-slate-500 pl-2 border-l-2 border-amber-300 space-y-1">
                        {lowSeasonNights > 0 && (
                            <p className="flex justify-between">
                                <span>Basse saison ({lowSeasonNights} nuits × {basePrice.toFixed(2)}€)</span>
                                <span>{(lowSeasonNights * basePrice).toFixed(2)} €</span>
                            </p>
                        )}
                        {highSeasonNights > 0 && (
                            <p className="flex justify-between text-amber-700 font-medium">
                                <span>Haute saison (+15%) ({highSeasonNights} nuits × {(basePrice * 1.15).toFixed(2)}€)</span>
                                <span>{(highSeasonNights * basePrice * 1.15).toFixed(2)} €</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* REMISE */}
                {discountMultiplier > 0 && (
                    <div className="flex justify-between items-center text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                        <span className="font-bold">Remise long séjour (-{(discountMultiplier * 100).toFixed(0)}%)</span>
                        <span className="font-bold">- {discountAmount.toFixed(2)} €</span>
                    </div>
                )}

                {/* TAXES */}
                <div className="pb-4 border-b border-amber-200/50 pt-2">
                    <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-slate-800">Taxes de séjour</span>
                        <span className="font-bold text-slate-800">{totalTaxes.toFixed(2)} €</span>
                    </div>
                    <div className="text-sm text-slate-500 pl-2 border-l-2 border-amber-300 space-y-1">
                        {adults > 0 && (
                            <p className="flex justify-between">
                                <span>Adultes ({adults} personnes × {extras.taxeAdulte.toFixed(2)}€ × {nights} nuits)</span>
                                <span>{(extras.taxeAdulte * adults * nights).toFixed(2)} €</span>
                            </p>
                        )}
                        {children > 0 && (
                            <p className="flex justify-between">
                                <span>Enfants ({children} personnnes × {extras.taxeEnfant.toFixed(2)}€ × {nights} nuits)</span>
                                <span>{(extras.taxeEnfant * children * nights).toFixed(2)} €</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* PISCINE */}
                {poolOptions.wantsPool && (
                    <div className="pb-4 pt-2">
                        <div className="flex justify-between items-start mb-2 text-emerald-700">
                            <span className="font-bold">Accès Piscine ({poolOptions.poolDays} jours)</span>
                            <span className="font-bold">+{totalPool.toFixed(2)} €</span>
                        </div>
                        <div className="text-sm text-emerald-600/80 pl-2 border-l-2 border-emerald-300 space-y-1">
                            {adults > 0 && (
                                <p className="flex justify-between">
                                    <span>Adultes ({adults} personnes × {extras.piscineAdulte.toFixed(2)}€ × {poolOptions.poolDays} jours)</span>
                                    <span>{(extras.piscineAdulte * adults * poolOptions.poolDays).toFixed(2)} €</span>
                                </p>
                            )}
                            {children > 0 && (
                                <p className="flex justify-between">
                                    <span>Enfants ({children} personnes × {extras.piscineEnfant.toFixed(2)}€ × {poolOptions.poolDays} jours)</span>
                                    <span>{(extras.piscineEnfant * children * poolOptions.poolDays).toFixed(2)} €</span>
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="border-t border-amber-200 pt-6 mb-8">
                <div className="flex justify-between items-end">
                    <span className="text-lg font-bold text-slate-800">Total à payer</span>
                    <span className="text-4xl font-black text-amber-600">{grandTotal.toFixed(2)} €</span>
                </div>
            </div>

            <button
                onClick={() => navigate('/checkout', { state: { grandTotal, productId } })}
                className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xl rounded-2xl shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-1 active:translate-y-0"
            >
                Confirmer et Payer
            </button>
        </div>
    );
};

export default BookingSummary;
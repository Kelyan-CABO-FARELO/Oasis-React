import React from 'react';
import { API_ROOT } from '../../constants/apiConstant.js';

const RetributionsGrid = ({ products, pendingEarnings, invoices }) => {
    return (
        <div className="bg-slate-900 rounded-[2rem] p-8 shadow-xl text-white">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-white/10 text-emerald-400 rounded-xl flex items-center justify-center text-2xl">💰</div>
                <div>
                    <h2 className="text-2xl font-black tracking-tight">Rétributions par Propriété</h2>
                    <p className="text-slate-400 text-xs mt-0.5 font-medium">Suivi en temps réel de vos gains et factures pour chacun de vos biens</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {products && products.length > 0 ? (
                    products.map(product => {
                        const productEarnings = pendingEarnings.filter(e => e.productName === product.title);
                        const productInvoices = invoices.filter(inv => 
                            inv.lineInvoices && inv.lineInvoices.some(line => {
                                const lp = line.LineProduct || line.lineProduct || '';
                                return lp.toLowerCase().includes(product.title.toLowerCase());
                            })
                        );
                        const totalProductRetribution = productEarnings.reduce((acc, e) => acc + e.retribution, 0);

                        return (
                            <div key={product.id} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 space-y-6 hover:border-white/20 transition-all">
                                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                    <div>
                                        <h3 className="text-lg font-black text-white">{product.title}</h3>
                                        <p className="text-slate-400 text-xs font-semibold">Propriété active</p>
                                    </div>
                                    <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3.5 py-1.5 rounded-full font-black uppercase tracking-wider">
                                        Sous contrat
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Gains en Temps Réel */}
                                    <div className="bg-white/5 rounded-2xl p-4 flex flex-col justify-between border border-white/5">
                                        <div>
                                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Gains Estimés (35%)</span>
                                            <span className="text-2xl font-black text-emerald-400">{totalProductRetribution.toFixed(2)} €</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 italic mt-3">Calculé sur les réservations payées de la saison</p>
                                    </div>

                                    {/* Statut Facturation */}
                                    <div className="bg-white/5 rounded-2xl p-4 flex flex-col justify-between border border-white/5">
                                        <div>
                                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Factures de Rétribution</span>
                                            <span className="text-2xl font-black text-amber-400">{productInvoices.length}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 italic mt-3">Factures officielles émises en fin de saison</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* Liste des Réservations */}
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Historique des Séjours</h4>
                                        {productEarnings.length > 0 ? (
                                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                                {productEarnings.map(earning => (
                                                    <div key={earning.id} className="bg-white/5 border border-white/5 rounded-xl p-3 flex justify-between items-center text-xs">
                                                        <div>
                                                            <p className="font-bold text-white">Séjour de {earning.nights} nuits</p>
                                                            <p className="text-slate-400 text-[10px]">{earning.startDate.toLocaleDateString('fr-FR')} - {earning.endDate.toLocaleDateString('fr-FR')}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="font-black text-emerald-400 block">+{earning.retribution.toFixed(2)} €</span>
                                                            <span className="text-slate-500 text-[10px] italic">Loyer : {earning.totalRent.toFixed(2)} €</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500 italic py-2">Aucun séjour client enregistré pour cette saison.</p>
                                        )}
                                    </div>

                                    {/* Liste des Factures */}
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Mes Factures Officielles</h4>
                                        {productInvoices.length > 0 ? (
                                            <div className="space-y-2">
                                                {productInvoices.map(invoice => (
                                                    <div key={invoice.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center hover:bg-white/10 transition-colors">
                                                        <div>
                                                            <h5 className="font-bold text-emerald-400 text-xs">{invoice.title}</h5>
                                                            <p className="text-[10px] text-slate-400">{new Date(invoice.createdAt).toLocaleDateString('fr-FR')}</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => {
                                                                const today = new Date();
                                                                const currentYear = today.getFullYear();
                                                                const invoiceYear = new Date(invoice.createdAt).getFullYear();
                                                                
                                                                if (invoiceYear === currentYear) {
                                                                    const endOfSeasonDate = new Date(`${currentYear}-10-10T00:00:00`);
                                                                    if (today < endOfSeasonDate) {
                                                                        alert("🔒 Les factures de rétribution ne sont téléchargeables qu'en fin de saison (à partir du 10 Octobre).");
                                                                        return;
                                                                    }
                                                                }
                                                                
                                                                // Utiliser API_ROOT pour cibler le bon serveur backend !
                                                                const fileUrl = `${API_ROOT}${invoice.path}`;
                                                                
                                                                // Ouvrir le PDF dans un nouvel onglet pour téléchargement direct
                                                                window.open(fileUrl, '_blank');
                                                            }}
                                                            disabled={!invoice.path || invoice.path === 'generation_en_attente'} 
                                                            className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-30 text-xs" 
                                                            title="Télécharger la facture (Disponible à partir du 10 Octobre)"
                                                        >
                                                            📥
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500 italic py-2">Aucune facture de rétribution disponible.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p className="text-slate-400 italic">Aucune propriété à afficher pour le moment.</p>
                )}
            </div>
        </div>
    );
};

export default RetributionsGrid;

import React, { useEffect, useState } from 'react';
import { API_ROOT } from '../../constants/apiConstant.js';
import { TOKEN_KEY } from '../../constants/appConstants.js';

const RgpdDashboard = () => {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCleaning, setIsCleaning] = useState(false);
    const [cleaningResult, setCleaningResult] = useState(null);

    const fetchRgpdStatus = async () => {
        setIsLoading(true);
        const token = localStorage.getItem(TOKEN_KEY);
        try {
            const response = await fetch(`${API_ROOT}/api/admin/rgpd/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) throw new Error("Impossible de charger le statut RGPD.");

            const data = await response.json();
            setStats(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRgpdStatus();
    }, []);

    const handleCleanup = async () => {
        if (!window.confirm("🚨 ATTENTION : Cette action va purger définitivement les factures numériques de plus de 3 ans de l'espace numérique et anonymiser les locataires et propriétaires expirés. Cette action est irréversible. Voulez-vous continuer ?")) {
            return;
        }

        setIsCleaning(true);
        setCleaningResult(null);
        const token = localStorage.getItem(TOKEN_KEY);
        try {
            const response = await fetch(`${API_ROOT}/api/admin/rgpd/cleanup`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) throw new Error("Une erreur est survenue lors de l'exécution du nettoyage.");

            const data = await response.json();
            setCleaningResult(data);
            alert(`✅ Nettoyage terminé avec succès !\n- Factures purgées : ${data.purgedInvoices}\n- Locataires anonymisés : ${data.anonymizedGuests}\n- Propriétaires anonymisés : ${data.anonymizedOwners}`);
            fetchRgpdStatus();
        } catch (err) {
            alert(`❌ Erreur : ${err.message}`);
        } finally {
            setIsCleaning(false);
        }
    };

    if (isLoading) return <div className="text-slate-500 font-bold animate-pulse py-12 text-center text-lg">⏳ Analyse de la base de données et calcul du score de conformité...</div>;
    if (error) return <div className="text-red-500 font-bold py-12 text-center">❌ Erreur : {error}</div>;

    const complianceScore = stats?.complianceScore ?? 100;
    const totalAlerts = (stats?.expiredGuestsCount || 0) + (stats?.expiredOwnersCount || 0) + (stats?.oldInvoicesCount || 0);

    return (
        <div className="space-y-8 animate-fade-in-up">
            
            {/* SCORE CARD & GLOBAL ACTION */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    {/* Gauge de Conformité */}
                    <div className="relative w-28 h-28 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="10" />
                            <circle cx="50" cy="50" r="40" fill="transparent" 
                                    stroke={complianceScore === 100 ? '#10b981' : '#f59e0b'} 
                                    strokeWidth="10" 
                                    strokeDasharray="251.2"
                                    strokeDashoffset={251.2 - (251.2 * complianceScore) / 100}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-out" />
                        </svg>
                        <span className="absolute text-2xl font-black text-slate-800">{complianceScore}%</span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800">Conformité RGPD Générale</h3>
                        <p className="text-slate-500 text-sm mt-1 max-w-md">
                            {complianceScore === 100 
                                ? "Félicitations ! Vos serveurs sont 100% en règle avec la réglementation RGPD. Aucune donnée expirée n'est présente."
                                : `Attention, ${totalAlerts} alerte(s) de conservation de données personnelles nécessitent votre attention.`
                            }
                        </p>
                    </div>
                </div>

                {totalAlerts > 0 && (
                    <button
                        onClick={handleCleanup}
                        disabled={isCleaning}
                        className="px-8 py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black rounded-2xl shadow-lg shadow-amber-100 hover:-translate-y-0.5 transition-all text-sm"
                    >
                        {isCleaning ? "Nettoyage en cours..." : "⚙️ Exécuter le nettoyage & l'anonymisation"}
                    </button>
                )}
            </div>

            {/* ALERTS DETAILS */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* 1. FACTURES > 3 ANS */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[350px]">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-3xl">🧾</span>
                            <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${stats.oldInvoicesCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-600'}`}>
                                {stats.oldInvoicesCount > 0 ? `${stats.oldInvoicesCount} à purger` : 'En règle'}
                            </span>
                        </div>
                        <h4 className="text-lg font-black text-slate-800">Factures à Archiver</h4>
                        <p className="text-xs text-slate-400 mt-1 font-semibold uppercase">Règle de conservation : 3 ans max</p>
                        <p className="text-slate-500 text-sm mt-3">
                            Les factures numériques doivent être supprimées de l'espace numérique 3 ans après leur émission. Elles doivent être imprimées au préalable.
                        </p>

                        {stats.oldInvoicesCount > 0 && (
                            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1">
                                {stats.oldInvoices.map(inv => (
                                    <div key={inv.id} className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-slate-700">{inv.title}</p>
                                            <p className="text-slate-400">{inv.person} • Créée le {inv.createdAt}</p>
                                        </div>
                                        <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full font-bold">Expirée</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. LOCATAIRES EXPIRÉS */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[350px]">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-3xl">👥</span>
                            <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${stats.expiredGuestsCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-600'}`}>
                                {stats.expiredGuestsCount > 0 ? `${stats.expiredGuestsCount} à anonymiser` : 'En règle'}
                            </span>
                        </div>
                        <h4 className="text-lg font-black text-slate-800">Locataires Expirés</h4>
                        <p className="text-xs text-slate-400 mt-1 font-semibold uppercase">Délai d'accès : 1 semaine / 1 an</p>
                        <p className="text-slate-500 text-sm mt-3">
                            Les données personnelles des locataires doivent être effacées et les comptes anonymisés 1 semaine après leur séjour (sauf accord de conservation temporaire de 1 an maximum).
                        </p>

                        {stats.expiredGuestsCount > 0 && (
                            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1">
                                {stats.expiredGuests.map(guest => (
                                    <div key={guest.id} className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs space-y-1">
                                        <div className="flex justify-between items-center">
                                            <p className="font-bold text-slate-700">{guest.firstname} {guest.lastname}</p>
                                            <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full font-bold truncate max-w-[120px]" title={guest.reason}>
                                                {guest.consent ? '1 an max' : '1 semaine max'}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 text-[10px]">Email: {guest.email}</p>
                                        <p className="text-slate-400 text-[10px] italic">Dernier séjour : {guest.lastStay} ({guest.days} jours)</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. PROPRIÉTAIRES EXPIRÉS */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[350px]">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-3xl">🤝</span>
                            <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${stats.expiredOwnersCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-600'}`}>
                                {stats.expiredOwnersCount > 0 ? `${stats.expiredOwnersCount} à anonymiser` : 'En règle'}
                            </span>
                        </div>
                        <h4 className="text-lg font-black text-slate-800">Contrats Propriétaires Expirés</h4>
                        <p className="text-xs text-slate-400 mt-1 font-semibold uppercase">Durée : Fin de contrat + 0 jours</p>
                        <p className="text-slate-500 text-sm mt-3">
                            À la fin du contrat d'un propriétaire, ses informations personnelles doivent être supprimées de l'espace numérique et son compte doit être immédiatement anonymisé.
                        </p>

                        {stats.expiredOwnersCount > 0 && (
                            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1">
                                {stats.expiredOwners.map(owner => (
                                    <div key={owner.id} className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs space-y-1">
                                        <div className="flex justify-between items-center">
                                            <p className="font-bold text-slate-700">{owner.firstname} {owner.lastname}</p>
                                            <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full font-bold">Contrat clos</span>
                                        </div>
                                        <p className="text-slate-400 text-[10px]">Email: {owner.email}</p>
                                        <p className="text-slate-400 text-[10px] italic">Expiré le {owner.contractEnd} (il y a {owner.daysExpired} jours)</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
};

export default RgpdDashboard;

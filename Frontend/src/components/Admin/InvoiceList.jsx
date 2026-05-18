import React, { useEffect, useState } from 'react';
import { API_ROOT } from '../../constants/apiConstant.js';
import { TOKEN_KEY } from '../../constants/appConstants.js';

const InvoiceList = () => {
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // États pour la recherche et pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchInvoices = async () => {
            const token = localStorage.getItem(TOKEN_KEY);
            try {
                const response = await fetch(`${API_ROOT}/api/invoices`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/ld+json'
                    }
                });

                if (!response.ok) throw new Error("Impossible de charger les factures.");

                const data = await response.json();
                let list = data['hydra:member'] || data.member || (Array.isArray(data) ? data : []);

                // On trie par les plus récentes en premier
                const sortedList = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setInvoices(sortedList);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInvoices();
    }, []);

    // Retour page 1 si on cherche
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Filtrage par Numéro ou par Nom du client
    const filteredInvoices = invoices.filter((inv) => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        const title = (inv.title || '').toLowerCase();
        const person = (inv.person || '').toLowerCase();
        return title.includes(searchLower) || person.includes(searchLower);
    });

    // Pagination
    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentInvoices = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);

    const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
    const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

    // Fonction pour calculer le total d'une facture (Si l'API renvoie les lignes)
    const calculateTotal = (lineInvoices) => {
        if (!lineInvoices || !Array.isArray(lineInvoices)) return 0;
        // On vérifie avec la Majuscule (LinePrice) ET la minuscule (linePrice) pour être sûr !
        const total = lineInvoices.reduce((sum, line) => sum + (line.LinePrice || line.linePrice || 0), 0);
        return total / 100;
    };

    if (isLoading) return <div className="text-emerald-600 font-bold animate-pulse text-lg">Chargement de la comptabilité... 🧾</div>;
    if (error) return <div className="text-red-500 font-bold">❌ {error}</div>;

    return (
        <div className="relative">

            {/* 🔍 BARRE DE RECHERCHE */}
            <div className="mb-6 bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-between gap-4">
                <div className="relative w-full max-w-md">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-emerald-400 text-lg">🔍</span>
                    <input
                        type="text"
                        placeholder="Chercher une facture (ex: FA-2026... ou Dupont)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border-2 border-emerald-50 rounded-xl focus:outline-none focus:border-emerald-400 bg-emerald-50/30 transition-colors font-medium text-slate-700"
                    />
                </div>
                {searchTerm && (
                    <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                        {filteredInvoices.length} facture(s)
                    </div>
                )}
            </div>

            {/* 📋 LE TABLEAU */}
            <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="border-b-2 border-slate-100 text-slate-400 uppercase text-xs tracking-wider">
                        <th className="pb-4 pt-2 px-2 font-bold">N° Facture</th>
                        <th className="pb-4 pt-2 px-2 font-bold">Date</th>
                        <th className="pb-4 pt-2 px-2 font-bold">Client</th>
                        <th className="pb-4 pt-2 px-2 font-bold">Statut PDF</th>
                        <th className="pb-4 pt-2 px-2 font-bold text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="text-sm font-medium text-slate-700">
                    {currentInvoices.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="py-12 text-center text-slate-400">
                                <span className="text-4xl block mb-3">📭</span>
                                Aucune facture trouvée.
                            </td>
                        </tr>
                    ) : (
                        currentInvoices.map((inv) => {
                            const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
                            const creationDate = inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('fr-FR', dateOptions) : 'Inconnue';

                            // Si la facture a plus de 3 ans, on l'affiche en rouge
                            const isOld = new Date() - new Date(inv.createdAt) > 3 * 365 * 24 * 60 * 60 * 1000;

                            return (
                                <tr key={inv.id} className="border-b border-slate-50 hover:bg-emerald-50/50 transition-colors">
                                    <td className="py-4 px-2 font-black text-slate-900">{inv.title}</td>
                                    <td className={`py-4 px-2 ${isOld ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                                        {creationDate}
                                        {isOld && <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Archivage Requis</span>}
                                    </td>
                                    <td className="py-4 px-2 font-bold text-slate-800">{inv.person}</td>
                                    <td className="py-4 px-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${inv.path === 'generation_en_attente' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {inv.path === 'generation_en_attente' ? 'En attente' : 'Généré'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-2 text-right">
                                        <button
                                            onClick={() => setSelectedInvoice(inv)}
                                            className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 font-bold px-4 py-2 bg-emerald-50 rounded-lg transition-colors"
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

            {/* 🔽 PAGINATION */}
            {filteredInvoices.length > 0 && (
                <div className="flex items-center justify-between mt-6 px-2">
                    <p className="text-sm text-slate-500 font-medium">
                        Affichage de <span className="font-bold text-slate-900">{indexOfFirstItem + 1}</span> à <span className="font-bold text-slate-900">{Math.min(indexOfLastItem, filteredInvoices.length)}</span>
                    </p>
                    <div className="flex gap-2">
                        <button onClick={handlePrevPage} disabled={currentPage === 1} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 disabled:opacity-50">Précédent</button>
                        <div className="px-4 py-2 bg-slate-50 border border-slate-100 text-slate-600 rounded-lg font-bold">Page {currentPage} / {totalPages}</div>
                        <button onClick={handleNextPage} disabled={currentPage === totalPages} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 disabled:opacity-50">Suivant</button>
                    </div>
                </div>
            )}

            {/* 🪄 LA MODALE DE DÉTAILS DE LA FACTURE */}
            {selectedInvoice && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">

                        <div className="p-6 border-b border-emerald-100 flex justify-between items-center bg-emerald-50">
                            <div>
                                <h3 className="text-2xl font-black text-emerald-900">{selectedInvoice.title}</h3>
                                <p className="text-emerald-600 font-bold mt-1">Éditée le {new Date(selectedInvoice.createdAt).toLocaleDateString('fr-FR')}</p>
                            </div>
                            <button onClick={() => setSelectedInvoice(null)} className="w-10 h-10 bg-white border border-emerald-200 rounded-full flex items-center justify-center text-emerald-600 hover:bg-emerald-100 hover:text-emerald-900 transition-colors font-bold text-xl pb-1">
                                x
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto space-y-6">

                            {/* Facturé à */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">👤 Facturé à</h4>
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                    <p className="font-black text-slate-900 text-xl">{selectedInvoice.person}</p>
                                </div>
                            </div>

                            {/* Lignes de facture */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">📝 Détail des prestations</h4>
                                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                                    {selectedInvoice.lineInvoices && selectedInvoice.lineInvoices.length > 0 ? (
                                        <table className="w-full text-left">
                                            <tbody className="divide-y divide-slate-100">
                                            {selectedInvoice.lineInvoices.map((line, index) => (
                                                <tr key={index} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-4 font-medium text-slate-700">{line.LineProduct || line.lineProduct}</td>
                                                    <td className="p-4 font-bold text-slate-900 text-right">{((line.LinePrice || line.linePrice) / 100).toFixed(2)} €</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                            <tfoot className="bg-emerald-50 border-t-2 border-emerald-100">
                                            <tr>
                                                <td className="p-4 font-black text-emerald-900 text-right">TOTAL TTC</td>
                                                <td className="p-4 font-black text-emerald-700 text-right text-xl">
                                                    {calculateTotal(selectedInvoice.lineInvoices).toFixed(2)} €
                                                </td>
                                            </tr>
                                            </tfoot>
                                        </table>
                                    ) : (
                                        <div className="p-6 text-center text-slate-500 italic">Détail des lignes non disponible via l'API.</div>
                                    )}
                                </div>
                            </div>

                            {/* Statut Document & Téléchargement */}
                            <div className="flex justify-end pt-4">
                                {selectedInvoice.path && selectedInvoice.path !== 'generation_en_attente' ? (
                                    <a
                                        href={`${API_ROOT}${selectedInvoice.path}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/10"
                                    >
                                        <span>📄</span> Télécharger le PDF (Facture)
                                    </a>
                                ) : (
                                    <button
                                        disabled
                                        className="px-6 py-3 bg-slate-100 text-slate-400 font-bold rounded-xl cursor-not-allowed flex items-center gap-2 border border-slate-200"
                                    >
                                        <span>⏳</span> {selectedInvoice.path === 'generation_en_attente' ? 'Génération du PDF en cours...' : 'PDF non disponible'}
                                    </button>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceList;
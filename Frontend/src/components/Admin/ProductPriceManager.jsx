import React, { useEffect, useState } from 'react';
import { API_ROOT } from '../../constants/apiConstant.js';
import { TOKEN_KEY } from '../../constants/appConstants.js';

const ProductPriceManager = () => {
    const [priceTypes, setPriceTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingType, setEditingType] = useState(null);
    const [newPrice, setNewPrice] = useState("");

    const fetchPrices = async () => {
        setIsLoading(true);
        const token = localStorage.getItem(TOKEN_KEY);
        try {
            const response = await fetch(`${API_ROOT}/api/admin/product-prices`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) throw new Error("Impossible de charger la grille tarifaire.");

            const data = await response.json();
            // On trie par nom de catégorie
            data.sort((a, b) => a.type.localeCompare(b.type));
            setPriceTypes(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPrices();
    }, []);

    const handleSave = async (type) => {
        if (!newPrice || isNaN(newPrice) || Number(newPrice) < 0) {
            alert("Veuillez entrer un prix valide supérieur à 0.");
            return;
        }

        const priceInCents = Math.round(Number(newPrice) * 100);
        const token = localStorage.getItem(TOKEN_KEY);
        
        try {
            const response = await fetch(`${API_ROOT}/api/admin/product-prices`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: type,
                    newPrice: priceInCents
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erreur lors de la mise à jour.");
            }

            const data = await response.json();
            alert(data.message || "Prix mis à jour avec succès !");
            
            setEditingType(null);
            setNewPrice("");
            fetchPrices(); // Rafraîchir les données
        } catch (err) {
            alert(`Erreur: ${err.message}`);
        }
    };

    if (isLoading) return <div className="text-amber-600 font-bold animate-pulse text-lg py-12 text-center">Chargement de la grille tarifaire... 💶</div>;
    if (error) return <div className="text-red-500 font-bold py-12 text-center">❌ Erreur : {error}</div>;

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="text-2xl font-black text-slate-800">Gestion de la Grille Tarifaire</h3>
                    <p className="text-slate-500 mt-1 max-w-xl">
                        Modifiez le prix de base d'un type de bien. La mise à jour s'appliquera automatiquement à tous les produits associés à ce type. Le prix est affiché et saisi en <span className="font-bold">Euros (€)</span>.
                    </p>
                </div>
                <div className="text-6xl drop-shadow-sm">💶</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {priceTypes.map((pt) => {
                    const priceInEuros = (pt.price / 100).toFixed(2);
                    const isEditing = editingType === pt.type;
                    
                    const typeLower = pt.type.toLowerCase();
                    const isTax = typeLower.includes('taxe de séjour');
                    const isExtra = typeLower.includes('piscine') || isTax;

                    return (
                        <div key={pt.type} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div className="mb-6">
                                <h4 className="text-lg font-black text-slate-800">{pt.type}</h4>
                                {!isExtra && (
                                    <span className="inline-block mt-2 bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1.5 rounded-full">
                                        {pt.count} bien(s) concerné(s)
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center justify-between mt-auto">
                                {isEditing ? (
                                    <div className="flex w-full items-center gap-2">
                                        <div className="relative flex-1">
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                className="w-full pl-3 pr-8 py-2.5 bg-amber-50 border border-amber-200 rounded-xl font-bold text-slate-700 outline-none focus:border-amber-500 transition-colors"
                                                value={newPrice}
                                                onChange={(e) => setNewPrice(e.target.value)}
                                                autoFocus
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">€</span>
                                        </div>
                                        <button 
                                            onClick={() => handleSave(pt.type)}
                                            className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-colors shadow-md shadow-emerald-500/20"
                                            title="Sauvegarder"
                                        >
                                            ✔️
                                        </button>
                                        <button 
                                            onClick={() => { setEditingType(null); setNewPrice(""); }}
                                            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-colors"
                                            title="Annuler"
                                        >
                                            ✖️
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-2xl font-black text-amber-600">
                                            {priceInEuros} <span className="text-lg">€</span>
                                        </div>
                                        {!isTax ? (
                                            <button 
                                                onClick={() => { setEditingType(pt.type); setNewPrice(priceInEuros); }}
                                                className="px-5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-xl transition-colors text-sm shadow-sm"
                                            >
                                                Modifier
                                            </button>
                                        ) : (
                                            <span className="text-xs text-slate-400 font-bold px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100 cursor-not-allowed">
                                                Taux Fixe Régional
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProductPriceManager;

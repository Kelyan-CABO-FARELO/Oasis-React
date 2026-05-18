import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../constants/apiConstant.js";
import { useBookingContext } from "../../contexts/BookingContext.jsx";
import PageLoader from "../../components/Loader/PageLoader.jsx";
import ErrorMessage from "../../components/UI/ErrorMessage.jsx";
import SearchForm from "../../components/Product/SearchForm.jsx";
import CampingMapProduct from "../../components/Map/CampingMapProduct.jsx";

const Product = () => {
    const navigate = useNavigate();
    const { searchParams, updateSearchParams } = useBookingContext();

    const [catalogProducts, setCatalogProducts] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);

    const getSeasonLimits = () => {
        const today = new Date();
        const currentYear = today.getFullYear();
        let seasonStart = new Date(`${currentYear}-05-05`);
        let seasonEnd = new Date(`${currentYear}-10-10`);

        if (today > seasonEnd) {
            seasonStart = new Date(`${currentYear + 1}-05-05`);
            seasonEnd = new Date(`${currentYear + 1}-10-10`);
        }

        const minSelectable = today > seasonStart ? today : seasonStart;
        return {
            minDate: minSelectable.toISOString().split('T')[0],
            maxDate: seasonEnd.toISOString().split('T')[0]
        };
    };

    const { minDate, maxDate } = getSeasonLimits();

    const fetchProducts = async (isSearch = false) => {
        setIsLoading(true);
        setError(null);
        try {
            let url = `${API_URL}/products?pagination=false`;
            if (isSearch && searchParams.startDate && searchParams.endDate) {
                url += `&startDate=${searchParams.startDate}&endDate=${searchParams.endDate}`;
            }

            const response = await fetch(url, { headers: { 'Accept': 'application/ld+json' } });
            if (!response.ok) throw new Error("Erreur lors de la récupération des données.");

            const data = await response.json();
            const productsList = data['member'] || data['hydra:member'] || (Array.isArray(data) ? data : []);

            const accommodationsOnly = productsList.filter(product => {
                const titleLowerCase = product.title.toLowerCase();
                return !titleLowerCase.includes('piscine') && !titleLowerCase.includes('taxe');
            });

            if (isSearch) {
                setAvailableProducts(accommodationsOnly);
            } else {
                setCatalogProducts(accommodationsOnly);
                setAvailableProducts(accommodationsOnly);
            }
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            // 1. On charge d'abord le catalogue complet (sans filtre)
            await fetchProducts(false);

            // 2. SEULEMENT APRÈS, s'il y a des dates, on filtre les disponibilités
            if (searchParams.startDate && searchParams.endDate) {
                setHasSearched(true);
                await fetchProducts(true);
            }
        };

        loadData();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchParams.startDate && searchParams.endDate && searchParams.startDate >= searchParams.endDate) {
            setError("La date de départ doit être après la date d'arrivée.");
            setHasSearched(false);
            return;
        }
        fetchProducts(true);
        setHasSearched(true);
    };

    if (isLoading && catalogProducts.length === 0) return <PageLoader />;

    const totalOccupants = Number(searchParams.nbAdults) + Number(searchParams.nbChildren);

    return (
        <div className="min-h-screen bg-[#fffdf0] p-6 md:p-12 font-sans text-slate-800 pb-24">
            <button onClick={() => navigate(-1)} className="mb-8 mt-10 font-bold text-amber-700 hover:text-amber-600 bg-amber-100 px-5 py-2 rounded-full flex items-center gap-2">
                ← Retour à l'accueil
            </button>

            <div className="max-w-7xl mx-auto mb-10 text-center">
                <span className="inline-block px-4 py-1 mb-4 text-xs font-bold tracking-widest text-amber-700 uppercase bg-amber-100 rounded-full">
                    Domaine L'Oasis
                </span>
                <h1 className="text-5xl font-black text-slate-900 drop-shadow-sm">
                    Plan <span className="text-amber-500">Interactif</span>
                </h1>
                <p className="mt-4 text-lg text-slate-600">Trouvez l'emplacement parfait pour votre séjour.</p>
            </div>

            <div className="max-w-5xl mx-auto mb-8 bg-white p-4 rounded-3xl shadow-xl shadow-amber-900/5 border border-amber-50 relative z-20">
                <div className="max-w-5xl mx-auto mb-8 bg-white p-4 rounded-3xl shadow-xl shadow-amber-900/5 border border-amber-50 relative z-20">
                    <SearchForm onSearch={handleSearch} minDate={minDate} maxDate={maxDate} />
                </div>
            </div>

            {error && <div className="max-w-2xl mx-auto mb-8"><ErrorMessage message={error} /></div>}

            {hasSearched ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="max-w-4xl mx-auto mb-10 flex flex-wrap justify-center gap-4">
                        <button onClick={() => setSelectedCategory('all')} className={`px-6 py-2 rounded-full font-bold transition-all ${selectedCategory === 'all' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-amber-100 border border-slate-200'}`}>Tous</button>
                        <button onClick={() => setSelectedCategory('mh')} className={`px-6 py-2 rounded-full font-bold transition-all ${selectedCategory === 'mh' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-amber-100 border border-slate-200'}`}>Mobil-Homes</button>
                        <button onClick={() => setSelectedCategory('caravane')} className={`px-6 py-2 rounded-full font-bold transition-all ${selectedCategory === 'caravane' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-amber-100 border border-slate-200'}`}>Caravanes</button>
                        <button onClick={() => setSelectedCategory('emplacement')} className={`px-6 py-2 rounded-full font-bold transition-all ${selectedCategory === 'emplacement' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-amber-100 border border-slate-200'}`}>Emplacements</button>
                    </div>

                    <div className="max-w-7xl mx-auto mb-16 relative z-10">
                        {isLoading && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center rounded-[2rem]">
                                <span className="font-bold text-amber-600 animate-pulse text-lg">Recherche des disponibilités...</span>
                            </div>
                        )}
                        <CampingMapProduct
                            allProducts={catalogProducts}
                            availableProducts={availableProducts}
                            selectedCategory={selectedCategory}
                            totalOccupants={totalOccupants}
                        />
                    </div>
                </div>
            ) : (
                <div className="max-w-4xl mx-auto mt-16 py-24 text-center bg-white/40 border-2 border-dashed border-amber-200 rounded-[3rem] px-6">
                    <span className="text-6xl block mb-6 opacity-80">🗺️</span>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-4">À vous de jouer !</h2>
                    <p className="text-lg text-slate-600 font-medium max-w-lg mx-auto">
                        Sélectionnez vos dates de séjour et le nombre de voyageurs ci-dessus, puis cliquez sur <span className="font-bold text-amber-600">Rechercher</span> pour dévoiler la carte des disponibilités.
                    </p>
                </div>
            )}
        </div>
    );
};

export default Product;
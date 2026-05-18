import React from 'react';
import { Link } from 'react-router-dom';
import {VIDEO_URL} from "../../constants/apiConstant.js";

const Home = () => {
    return (
        <div className="min-h-screen bg-[#fffdf0] text-slate-800 font-sans selection:bg-amber-200">
            {/* --- SECTION HERO SOLAIRE AVEC VIDÉO --- */}
            <header className="relative h-[85vh] flex items-center justify-center overflow-hidden">
                {/* Vidéo de fond */}
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute z-0 w-auto min-w-full min-h-full max-w-none object-cover opacity-80"
                >
                    {/* On utilise la constante VIDEO_URL pour le chemin */}
                    <source src={`${VIDEO_URL}/presentation_camping.mp4`} type="video/mp4" />
                    Votre navigateur ne supporte pas la lecture de vidéos.
                </video>

                {/* Overlay Lumineux (Effet Solaire) */}
                {/* Le dégradé va d'un blanc transparent vers un jaune ambre très clair pour illuminer la vidéo */}
                <div className="absolute inset-0 z-10 bg-linear-to-b from-white/10 via-amber-50/40 to-[#fffdf0]" />

                {/* Contenu du Hero */}
                <div className="relative z-20 text-center px-6 max-w-4xl">
                    <span className="inline-block px-5 py-2 mb-6 text-sm font-bold tracking-[0.3em] text-amber-700 uppercase bg-white/90 rounded-full shadow-sm">
                        Expérience 3 Étoiles
                    </span>
                    <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-6 tracking-tight drop-shadow-sm">
                        L'Oasis<span className="text-amber-500">.</span>
                    </h1>
                    <p className="text-xl md:text-2xl font-medium text-slate-800 max-w-2xl mx-auto leading-relaxed">
                        Véritable paradis hors du temps, là où les Pyrénées se jettent dans la Méditerranée.
                    </p>
                </div>

                {/* Indicateur de scroll (optionnel) */}
                <div className="absolute bottom-10 z-20 animate-bounce text-amber-600">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>
            </header>

            {/* --- CONTENU PRINCIPAL --- */}
            <main className="max-w-6xl mx-auto px-6 -mt-12 relative z-30 pb-24">

                {/* Badge Dates d'Ouverture */}
                <div className="flex justify-center mb-16">
                    <div className="bg-emerald-500 text-white px-10 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border-4 border-white">
                        <a href="/product">
                            <span className="text-2xl">☀️</span>
                            <span className="font-bold text-lg uppercase tracking-wide">
                                Ouvert du 05 mai au 10 octobre
                            </span>
                        </a>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-10">
                    {/* Colonne de texte principale */}
                    <section className="lg:col-span-2 bg-white/90 backdrop-blur-xl p-10 md:p-14 rounded-[3rem] shadow-xl shadow-amber-900/5 border border-white">
                        <h2 className="text-4xl font-extrabold text-slate-900 mb-8 leading-tight">
                            Bienvenue dans le plus beau camping <br/>
                            <span className="text-amber-500">de la région</span>
                        </h2>

                        <div className="space-y-8 text-lg text-slate-600 leading-relaxed">
                            <p>
                                <strong className="text-slate-900">L'Oasis</strong> vous ouvre les portes de son incroyable domaine
                                situé à <span className="text-amber-600 font-semibold">900 mètres du bord de mer</span> et de la plage.
                            </p>

                            <p>
                                Retrouvez au sein d’un <span className="underline decoration-amber-300 decoration-4 underline-offset-4">parc arboré de 22 hectares</span> l’un des plus beaux espaces aquatiques de France :
                                toboggans, pataugeoires et piscines couvertes et chauffées.
                            </p>

                            <p className="bg-amber-50 p-6 rounded-2xl border-l-4 border-amber-400 italic">
                                "Référence dans l’hôtellerie de plein air, notre camping propose des mobil homes
                                modernes et design pour un séjour placé sous le signe du confort."
                            </p>
                        </div>
                    </section>

                    {/* Sidebar de Contact Solaire */}
                    <aside className="space-y-6">
                        <div className="bg-linear-to-br from-amber-400 to-orange-500 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-orange-200">
                            <h3 className="text-2xl font-bold mb-6">Prêt pour l'évasion ?</h3>
                            <p className="mb-8 opacity-90 font-medium">Nos équipes sont disponibles pour préparer votre séjour de rêve.</p>

                            <div className="space-y-4">
                                <a href="tel:0661924630" className="flex items-center gap-4 bg-white/20 hover:bg-white/30 transition-all p-4 rounded-2xl backdrop-blur-md group">
                                    <span className="text-2xl group-hover:scale-110 transition-transform">📞</span>
                                    <span className="font-bold text-lg">+33(0)6 61 92 46 30</span>
                                </a>

                                <a href="mailto:contact@loasis.com" className="flex items-center gap-4 bg-white/20 hover:bg-white/30 transition-all p-4 rounded-2xl backdrop-blur-md group">
                                    <span className="text-2xl group-hover:scale-110 transition-transform">✉️</span>
                                    <span className="font-medium truncate">contact.cf@loasis.com</span>
                                </a>
                            </div>
                        </div>

                        {/* Petite Info Complémentaire */}
                        <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100">
                            <p className="text-emerald-800 font-bold mb-1">Localisation Idéale</p>
                            <p className="text-emerald-700/80 text-sm">À deux pas de l'Espagne et de la Côte Vermeille.</p>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default Home;
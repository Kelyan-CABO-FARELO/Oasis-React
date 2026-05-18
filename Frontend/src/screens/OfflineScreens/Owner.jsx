import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_ROOT } from '../../constants/apiConstant.js';

const Owner = () => {
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        message: ''
    });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${API_ROOT}/api/submit-owner-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstname: formData.firstname,
                    lastname: formData.lastname,
                    email: formData.email,
                    mobile: formData.phone, // "mobile" dans ton entité User

                    // 💡 L'étiquette magique pour le dashboard admin
                    wantsToBecomeOwner: true,
                    isOwner: false,
                    isActive: true,

                    // 🔐 Un mot de passe aléatoire requis par le backend
                    password: Math.random().toString(36).slice(-10) + "A1!"
                })
            });

            if (response.ok) {
                setIsSubmitted(true);
            } else {
                alert("Erreur : Cet e-mail est peut-être déjà utilisé sur notre site.");
            }
        } catch (err) {
            console.error(err);
            alert("Erreur de connexion au serveur.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fffdf0] font-sans pb-20">
            {/* HERO SECTION */}
            <div className="pt-32 pb-20 px-6 bg-emerald-900 text-white relative overflow-hidden rounded-b-[3rem] shadow-xl">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute -top-20 -right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 -left-10 w-72 h-72 bg-emerald-400 rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-4xl mx-auto text-center relative z-10 animate-fade-in-up">
                    <span className="px-4 py-2 bg-emerald-800 text-emerald-200 font-bold rounded-full text-sm uppercase tracking-wider mb-6 inline-block border border-emerald-700">
                        Investissement & Plaisir
                    </span>
                    <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">
                        Devenez propriétaire au <span className="text-emerald-400">Domaine L'Oasis.</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-emerald-100/90 font-medium leading-relaxed max-w-3xl mx-auto">
                        Offrez-vous une résidence secondaire en pleine nature, profitez des infrastructures du domaine et générez des revenus locatifs.
                    </p>
                </div>
            </div>

            {/* AVANTAGES */}
            <div className="max-w-6xl mx-auto px-6 -mt-10 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
                        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl mb-6">🏕️</div>
                        <h3 className="text-xl font-black text-slate-800 mb-3">Votre coin de paradis</h3>
                        <p className="text-slate-600 font-medium">Votre seconde maison vous attend durant toute la période d'ouverture du domaine.</p>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
                        <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-3xl mb-6">🏊‍♂️</div>
                        <h3 className="text-xl font-black text-slate-800 mb-3">Infrastructures VIP</h3>
                        <p className="text-slate-600 font-medium">Profitez d'un accès illimité à l'espace aquatique et aux animations du domaine.</p>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
                        <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-6">💶</div>
                        <h3 className="text-xl font-black text-slate-800 mb-3">Revenus locatifs</h3>
                        <p className="text-slate-600 font-medium">Sous-louez votre bien par notre intermédiaire ! Nous gérons l'accueil et le ménage.</p>
                    </div>
                </div>
            </div>

            {/* FORMULAIRE */}
            <div className="max-w-6xl mx-auto px-6 mt-24 grid md:grid-cols-2 gap-16 items-center">
                <div className="space-y-6">
                    <h2 className="text-3xl md:text-4xl font-black text-slate-800">Comment ça marche ?</h2>
                    <ul className="space-y-4 mt-8">
                        <li className="flex items-start gap-4">
                            <span className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold">1</span>
                            <div>
                                <h4 className="font-bold text-slate-800">Prenez rendez-vous</h4>
                                <p className="text-slate-600 text-sm">Contactez-nous pour organiser une visite et découvrir les biens disponibles.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-4">
                            <span className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold">2</span>
                            <div>
                                <h4 className="font-bold text-slate-800">Choisissez votre modèle</h4>
                                <p className="text-slate-600 text-sm">Neuf ou occasion, choisissez le mobil-home qui correspond à vos envies.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-4">
                            <span className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold">3</span>
                            <div>
                                <h4 className="font-bold text-slate-800">Remise des clés</h4>
                                <p className="text-slate-600 text-sm">Nous gérons l'installation. Il ne vous reste plus qu'à poser vos valises !</p>
                            </div>
                        </li>
                    </ul>
                </div>

                <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl border border-emerald-50">
                    {isSubmitted ? (
                        <div className="text-center py-10">
                            <div className="text-6xl mb-4">🎉</div>
                            <h3 className="text-2xl font-black text-emerald-800 mb-2">Message envoyé !</h3>
                            <p className="text-slate-600 font-medium mb-6">Notre équipe va vous recontacter très rapidement.</p>
                            <button onClick={() => setIsSubmitted(false)} className="text-emerald-600 font-bold hover:underline">Envoyer une autre demande</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <h3 className="text-2xl font-black text-slate-800 mb-6">Être recontacté(e)</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Prénom</label>
                                    <input type="text" id="firstname" required value={formData.firstname} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border bg-slate-50 focus:border-emerald-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Nom</label>
                                    <input type="text" id="lastname" required value={formData.lastname} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border bg-slate-50 focus:border-emerald-500 outline-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                                <input type="email" id="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border bg-slate-50 focus:border-emerald-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Téléphone</label>
                                <input type="tel" id="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border bg-slate-50 focus:border-emerald-500 outline-none" />
                            </div>

                            <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg mt-4 disabled:opacity-50">
                                {loading ? 'Envoi en cours...' : 'Demander des informations'}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto mt-24 text-center">
                <Link to="/" className="text-slate-500 hover:text-emerald-600 font-bold transition-colors">
                    ← Retourner à l'accueil
                </Link>
            </div>
        </div>
    );
};

export default Owner;
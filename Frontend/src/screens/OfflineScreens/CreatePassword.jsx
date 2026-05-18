import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';

const CreatePassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // On récupère le token dans l'URL (ex: monsite.com/creer-mot-de-passe?token=123456)
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Si le client arrive sur cette page sans token dans l'URL, c'est une erreur
        if (!token) {
            setError("Lien invalide ou expiré. Veuillez vérifier l'e-mail que vous avez reçu.");
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // 1. Vérification de base
        if (password.length < 6) {
            return setError("Votre mot de passe doit contenir au moins 6 caractères.");
        }
        if (password !== confirmPassword) {
            return setError("Les mots de passe ne correspondent pas.");
        }

        // 2. Envoi à l'API Symfony
        setLoading(true);
        try {
            await apiFetch('/set-new-password', {
                method: 'POST',
                body: JSON.stringify({ token, password })
            });

            setSuccess(true);
            // Redirection vers la page de connexion après 3 secondes
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            setError(err.message || "Une erreur est survenue. Ce lien a peut-être déjà été utilisé.");
        } finally {
            setLoading(false);
        }
    };

    if (!token && !error) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100">

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                        🔐
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">Bienvenue au Domaine</h2>
                    <p className="text-slate-500 font-medium mt-2">Veuillez créer votre mot de passe pour accéder à votre Espace Propriétaire.</p>
                </div>

                {success ? (
                    <div className="bg-emerald-50 text-emerald-700 p-6 rounded-2xl text-center border border-emerald-100 animate-in zoom-in">
                        <span className="text-4xl block mb-2">✅</span>
                        <h3 className="font-bold text-lg mb-1">Mot de passe enregistré !</h3>
                        <p className="text-sm">Vous allez être redirigé vers la page de connexion...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold text-center border border-red-100">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Nouveau mot de passe</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                                placeholder="••••••••"
                                required
                                disabled={loading || !token}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Confirmer le mot de passe</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full px-5 py-4 bg-slate-50 border rounded-xl outline-none transition-all ${
                                    confirmPassword && password !== confirmPassword 
                                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                                    : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                                }`}
                                placeholder="••••••••"
                                required
                                disabled={loading || !token}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !token}
                            className="w-full py-4 bg-emerald-600 text-white font-black rounded-xl shadow-lg hover:bg-emerald-700 disabled:opacity-50 transition-all flex justify-center items-center gap-2 mt-4"
                        >
                            {loading ? 'Enregistrement...' : 'Accéder à mon espace'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CreatePassword;
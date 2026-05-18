import React, { useEffect, useState } from 'react';
import { API_ROOT } from '../../constants/apiConstant.js';
import { TOKEN_KEY } from '../../constants/appConstants.js';

const UserList = () => {
    // États pour les données
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    // État pour la recherche
    const [searchTerm, setSearchTerm] = useState('');

    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchUsers = async () => {
            const token = localStorage.getItem(TOKEN_KEY);
            try {
                const response = await fetch(`${API_ROOT}/api/users`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/ld+json'
                    }
                });

                if (!response.ok) throw new Error("Impossible de charger les utilisateurs.");

                const data = await response.json();

                let list = [];
                if (data.member) {
                    list = data.member;
                } else if (data['hydra:member']) {
                    list = data['hydra:member'];
                } else if (Array.isArray(data)) {
                    list = data;
                } else {
                    throw new Error("Format de données inattendu.");
                }

                // On filtre pour exclure les comptes anonymisés RGPD (ceux dont l'email commence par 'anonyme_')
                const activeUsers = list.filter(user => !(user.email || '').startsWith('anonyme_'));

                // On trie par les plus récents (ID le plus grand)
                const sortedList = [...activeUsers].sort((a, b) => b.id - a.id);
                setUsers(sortedList);

            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // Réinitialisation de la page si on fait une recherche
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Filtrage (Recherche par nom, prénom ou email)
    const filteredUsers = users.filter((user) => {
        if (!searchTerm) return true;

        const searchLower = searchTerm.toLowerCase();
        const fullName = `${user.firstname || ''} ${user.lastname || ''}`.toLowerCase();
        const email = (user.email || '').toLowerCase();

        return fullName.includes(searchLower) || email.includes(searchLower);
    });

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

    const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
    const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

    if (isLoading) return <div className="text-slate-500 font-bold animate-pulse">Chargement des utilisateurs...</div>;
    if (error) return <div className="text-red-500 font-bold">❌ {error}</div>;

    return (
        <div className="relative">

            {/* 🔍 BARRE DE RECHERCHE */}
            <div className="mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between gap-4">
                <div className="relative w-full max-w-md">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 text-lg">🔍</span>
                    <input
                        type="text"
                        placeholder="Rechercher par nom ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border-2 border-slate-100 rounded-xl focus:outline-none focus:border-indigo-400 bg-slate-50 transition-colors font-medium text-slate-700"
                    />
                </div>
                {searchTerm && (
                    <div className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg">
                        {filteredUsers.length} résultat(s)
                    </div>
                )}
            </div>

            {/* 📋 LE TABLEAU */}
            <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="border-b-2 border-slate-100 text-slate-400 uppercase text-xs tracking-wider">
                        <th className="pb-4 pt-2 px-2 font-bold">N°</th>
                        <th className="pb-4 pt-2 px-2 font-bold">Client</th>
                        <th className="pb-4 pt-2 px-2 font-bold">Email</th>
                        <th className="pb-4 pt-2 px-2 font-bold">Téléphone</th>
                        <th className="pb-4 pt-2 px-2 font-bold">Rôle</th>
                        <th className="pb-4 pt-2 px-2 font-bold text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="text-sm font-medium text-slate-700">
                    {currentUsers.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="py-12 text-center text-slate-400">
                                <span className="text-4xl block mb-3">🧐</span>
                                Aucun utilisateur trouvé.
                            </td>
                        </tr>
                    ) : (
                        currentUsers.map((user) => {
                            const isAdmin = user.roles && user.roles.includes('ROLE_ADMIN');
                            const isOwner = user.roles && user.roles.includes('ROLE_OWNER');

                            return (
                                <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                    <td className="py-4 px-2 font-black text-slate-900">#{user.id}</td>
                                    <td className="py-4 px-2 font-bold text-slate-800">
                                        {user.firstname} {user.lastname}
                                    </td>
                                    <td className="py-4 px-2 text-slate-500">{user.email}</td>
                                    <td className="py-4 px-2 text-slate-500">{user.mobile || 'Non renseigné'}</td>
                                    <td className="py-4 px-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {isAdmin ? 'Administrateur' : isOwner ? 'Propriètaire' : 'Client'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-2 text-right">
                                        <button
                                            onClick={() => setSelectedUser(user)}
                                            className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100 font-bold px-4 py-2 bg-indigo-50 rounded-lg transition-colors"
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

            {/* 🔽 CONTRÔLES DE PAGINATION */}
            {filteredUsers.length > 0 && (
                <div className="flex items-center justify-between mt-6 px-2">
                    <p className="text-sm text-slate-500 font-medium">
                        Affichage de <span className="font-bold text-slate-900">{indexOfFirstItem + 1}</span> à <span className="font-bold text-slate-900">{Math.min(indexOfLastItem, filteredUsers.length)}</span> sur <span className="font-bold text-slate-900">{filteredUsers.length}</span>
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            Précédent
                        </button>
                        <div className="px-4 py-2 bg-slate-50 border border-slate-100 text-slate-600 rounded-lg font-bold">
                            Page {currentPage} / {totalPages}
                        </div>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            Suivant
                        </button>
                    </div>
                </div>
            )}

            {/* 🪄 LA MODALE DE DÉTAILS DU COMPTE */}
            {selectedUser && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">

                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">Utilisateur #{selectedUser.id}</h3>
                                <p className="text-slate-500 font-medium mt-1">Fiche client détaillée</p>
                            </div>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors font-bold text-xl pb-1"
                            >
                                x
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto space-y-6">

                            {/* Identité */}
                            <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-black shadow-inner">
                                    {selectedUser.firstname ? selectedUser.firstname.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 text-xl">{selectedUser.firstname} {selectedUser.lastname}</p>
                                    <p className="text-slate-500 font-medium">{selectedUser.roles && selectedUser.roles.includes('ROLE_ADMIN') ? '👑 Administrateur' : '👤 Client'}</p>
                                </div>
                            </div>

                            {/* Contact */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">📞 Coordonnées</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                                        <span className="text-slate-500 font-medium">Email</span>
                                        <span className="font-bold text-slate-900">{selectedUser.email}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                                        <span className="text-slate-500 font-medium">Téléphone</span>
                                        <span className="font-bold text-slate-900">{selectedUser.mobile || 'Non renseigné'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Statut du compte (Optionnel : si tu as gardé isActive) */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">⚙️ Statut du compte</h4>
                                <div className={`p-4 rounded-xl border flex justify-between items-center ${(selectedUser.isActive || selectedUser.active) ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                                    <span className="font-medium text-slate-600">Accès au site</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${(selectedUser.isActive || selectedUser.active) ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                        {(selectedUser.isActive || selectedUser.active) ? 'Autorisé' : 'Bloqué / Inactif'}
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserList;
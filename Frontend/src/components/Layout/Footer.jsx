import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="py-12 mt-auto flex flex-col items-center justify-center gap-6 text-center text-slate-400 border-t border-amber-100 bg-[#fffdf0]">
            <p className="font-medium italic">
                © {new Date().getFullYear()} Camping L'Oasis *** — Le soleil du sud.
            </p>

            <Link
                to="/login"
                className="text-xs font-bold text-slate-300 hover:text-amber-600 uppercase tracking-widest transition-colors flex items-center gap-2"
            >
                🔒 Espace Gérant & Propriétaires
            </Link>
        </footer>
    );
};

export default Footer;
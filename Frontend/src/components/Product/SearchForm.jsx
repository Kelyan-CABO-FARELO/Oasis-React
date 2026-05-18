import React from 'react';
import { useBookingContext } from "../../contexts/BookingContext.jsx";

const SearchForm = ({ onSearch, minDate, maxDate }) => {
    const { searchParams, updateSearchParams } = useBookingContext();

    return (
        <form onSubmit={onSearch} className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full flex flex-col px-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Arrivée</label>
                <input
                    type="date"
                    value={searchParams.startDate}
                    onChange={(e) => updateSearchParams({ startDate: e.target.value })}
                    min={minDate}
                    max={maxDate}
                    className="w-full text-lg font-medium text-slate-700 bg-transparent border-b-2 border-slate-100 focus:border-amber-400 outline-none py-2 transition-colors cursor-pointer"
                    required
                />
            </div>

            <div className="hidden md:block w-px h-12 bg-slate-100"></div>

            <div className="flex-1 w-full flex flex-col px-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Départ</label>
                <input
                    type="date"
                    value={searchParams.endDate}
                    onChange={(e) => updateSearchParams({ endDate: e.target.value })}
                    min={searchParams.startDate || minDate}
                    max={maxDate}
                    className="w-full text-lg font-medium text-slate-700 bg-transparent border-b-2 border-slate-100 focus:border-amber-400 outline-none py-2 transition-colors cursor-pointer"
                    required
                />
            </div>

            <div className="hidden md:block w-px h-12 bg-slate-100"></div>

            <div className="flex w-full md:w-1/4 flex-col px-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Adultes</label>
                <input
                    type="number" min="1" max="8"
                    value={searchParams.nbAdults}
                    onChange={(e) => updateSearchParams({ nbAdults: e.target.value })}
                    className="w-full text-lg font-medium text-slate-700 bg-transparent border-b-2 border-slate-100 focus:border-amber-400 outline-none py-2 transition-colors cursor-pointer"
                    required
                />
            </div>

            <div className="hidden md:block w-px h-12 bg-slate-100"></div>

            <div className="flex w-full md:w-1/4 flex-col px-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Enfants</label>
                <input
                    type="number" min="0" max="6"
                    value={searchParams.nbChildren}
                    onChange={(e) => updateSearchParams({ nbChildren: e.target.value })}
                    className="w-full text-lg font-medium text-slate-700 bg-transparent border-b-2 border-slate-100 focus:border-amber-400 outline-none py-2 transition-colors cursor-pointer"
                    required
                />
            </div>

            <div className="w-full md:w-auto px-4 mt-4 md:mt-0">
                <button type="submit" className="w-full md:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-1">
                    Rechercher
                </button>
            </div>
        </form>
    );
};

export default SearchForm;
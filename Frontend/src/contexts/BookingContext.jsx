import React, { createContext, useContext, useState, useEffect } from 'react';

const BookingContext = createContext(null);

export const BookingContextProvider = ({ children }) => {
    // Initialisation avec le localStorage pour ne pas perdre la recherche au rafraîchissement
    const [searchParams, setSearchParams] = useState(() => {
        const saved = localStorage.getItem('booking_search');
        return saved ? JSON.parse(saved) : { startDate: '', endDate: '', nbAdults: 2, nbChildren: 0 };
    });

    const [poolOptions, setPoolOptions] = useState({
        wantsPool: false,
        poolDays: 1
    });

    // Sauvegarde automatique de la recherche dans le navigateur
    useEffect(() => {
        localStorage.setItem('booking_search', JSON.stringify(searchParams));
    }, [searchParams]);

    const updateSearchParams = (params) => {
        setSearchParams(prev => ({ ...prev, ...params }));
    };

    const updatePoolOptions = (options) => {
        setPoolOptions(prev => ({ ...prev, ...options }));
    };

    const value = {
        searchParams,
        updateSearchParams,
        poolOptions,
        updatePoolOptions
    };

    return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};

export const useBookingContext = () => useContext(BookingContext);
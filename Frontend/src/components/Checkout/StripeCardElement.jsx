import React from 'react';
import { CardElement } from '@stripe/react-stripe-js';

const StripeCardElement = () => {
    return (
        <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-100 focus-within:border-amber-400 transition-all">
            <CardElement options={{
                style: {
                    base: {
                        fontSize: '18px',
                        color: '#1e293b',
                        '::placeholder': { color: '#94a3b8' },
                    },
                },
            }} />
        </div>
    );
};

export default StripeCardElement;
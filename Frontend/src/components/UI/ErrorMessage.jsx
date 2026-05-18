import React from 'react';

const ErrorMessage = ({message}) => {
    return (
        <div className="mt-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30">
            <p className="text-red-400 text-sm">{message}</p>
        </div>
    );
};

export default ErrorMessage;
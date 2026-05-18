import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthContextProvider } from "./contexts/AuthContext.jsx";
import { BookingContextProvider } from "./contexts/BookingContext.jsx";

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <AuthContextProvider>
            <BookingContextProvider>
                <App />
            </BookingContextProvider>
        </AuthContextProvider>
    </StrictMode>,
);
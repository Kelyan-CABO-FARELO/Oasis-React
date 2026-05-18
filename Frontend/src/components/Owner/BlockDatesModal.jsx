import React from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const BlockDatesModal = ({
    selectedProduct,
    onClose,
    bookingStartDate,
    setBookingStartDate,
    bookingEndDate,
    setBookingEndDate,
    bookingLoading,
    bookingMessage,
    handleReserveProperty,
    loadingReservations,
    productReservations
}) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                >
                    ✕
                </button>
                
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl">📅</div>
                    <h3 className="text-xl font-black text-slate-800">Bloquer des dates</h3>
                </div>
                
                <p className="text-slate-500 text-sm mb-6">
                    Sélectionnez les dates pour lesquelles vous souhaitez bloquer <strong>{selectedProduct.title}</strong> pour votre usage personnel.
                </p>

                {bookingMessage && (
                    <div className={`p-4 rounded-xl mb-6 font-bold text-sm ${bookingMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {bookingMessage.text}
                    </div>
                )}

                {loadingReservations ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4">
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-500 font-medium animate-pulse">Chargement du calendrier...</p>
                    </div>
                ) : (
                    <form onSubmit={handleReserveProperty} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Date d'arrivée</label>
                            <DatePicker 
                                selected={bookingStartDate}
                                onChange={(date) => {
                                    setBookingStartDate(date);
                                    if (bookingEndDate && date > bookingEndDate) {
                                        setBookingEndDate(null);
                                    }
                                }}
                                selectsStart
                                startDate={bookingStartDate}
                                endDate={bookingEndDate}
                                minDate={(() => {
                                    const today = new Date();
                                    today.setHours(0,0,0,0);
                                    const opening = new Date(today.getFullYear(), 4, 5); // 5 Mai
                                    return today > opening ? today : opening;
                                })()}
                                maxDate={new Date(new Date().getFullYear(), 9, 10)} // 10 Octobre
                                excludeDates={productReservations.reduce((acc, res) => {
                                    if (!res.startDate || !res.endDate) return acc;
                                    const start = new Date(res.startDate);
                                    const end = new Date(res.endDate);
                                    let current = new Date(start);
                                    while (current <= end) {
                                        acc.push(new Date(current));
                                        current.setDate(current.getDate() + 1);
                                    }
                                    return acc;
                                }, [])}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="Sélectionnez une date"
                                required
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 bg-slate-50 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Date de départ</label>
                            <DatePicker 
                                selected={bookingEndDate}
                                onChange={(date) => setBookingEndDate(date)}
                                selectsEnd
                                startDate={bookingStartDate}
                                endDate={bookingEndDate}
                                minDate={bookingStartDate || (() => {
                                    const today = new Date();
                                    today.setHours(0,0,0,0);
                                    const opening = new Date(today.getFullYear(), 4, 5);
                                    return today > opening ? today : opening;
                                })()}
                                maxDate={new Date(new Date().getFullYear(), 9, 10)}
                                excludeDates={productReservations.reduce((acc, res) => {
                                    if (!res.startDate || !res.endDate) return acc;
                                    const start = new Date(res.startDate);
                                    const end = new Date(res.endDate);
                                    let current = new Date(start);
                                    while (current <= end) {
                                        acc.push(new Date(current));
                                        current.setDate(current.getDate() + 1);
                                    }
                                    return acc;
                                }, [])}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="Sélectionnez une date"
                                required
                                disabled={!bookingStartDate}
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 bg-slate-50 outline-none focus:border-emerald-500 focus:bg-white transition-all disabled:opacity-50"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={bookingLoading || !bookingStartDate || !bookingEndDate}
                            className="w-full mt-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {bookingLoading ? 'Enregistrement... ⏳' : 'Confirmer la période'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default BlockDatesModal;

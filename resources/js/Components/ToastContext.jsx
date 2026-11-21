import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3500);
    }, []);

    return (
        <ToastContext.Provider value={{ toast: addToast }}>
            {children}
            <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm font-medium transition-all ${
                            t.type === 'error'
                                ? 'bg-red-600 text-white border-red-500'
                                : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-800 dark:border-zinc-200'
                        }`}
                    >
                        {t.type === 'error' ? (
                            <AlertCircle className="w-4 h-4 shrink-0" />
                        ) : (
                            <CheckCircle2 className="w-4 h-4 text-sky-400 dark:text-sky-600 shrink-0" />
                        )}
                        <span className="flex-1">{t.message}</span>
                        <button
                            onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                            className="opacity-70 hover:opacity-100"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}

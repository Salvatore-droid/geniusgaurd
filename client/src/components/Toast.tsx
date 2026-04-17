import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
}

interface ToastContextType {
    addToast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType>({ addToast: () => { } });

export function useToast() {
    return useContext(ToastContext);
}

const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const colors = {
    success: "border-green-500/30 bg-green-500/10 text-green-400",
    error: "border-red-500/30 bg-red-500/10 text-red-400",
    warning: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    info: "border-blue-500/30 bg-blue-500/10 text-blue-400",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [exiting, setExiting] = useState<Set<string>>(new Set());

    const addToast = useCallback((type: ToastType, title: string, message?: string) => {
        const id = Math.random().toString(36).slice(2);
        setToasts(prev => [...prev, { id, type, title, message }]);
        // Auto-dismiss after 4s
        setTimeout(() => dismissToast(id), 4000);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setExiting(prev => new Set(prev).add(id));
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
            setExiting(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }, 300);
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => {
                    const Icon = icons[toast.type];
                    const isExiting = exiting.has(toast.id);
                    return (
                        <div
                            key={toast.id}
                            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm max-w-sm ${colors[toast.type]} ${isExiting ? "toast-exit" : "toast-enter"}`}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground">{toast.title}</p>
                                {toast.message && <p className="text-xs mt-0.5 opacity-80">{toast.message}</p>}
                            </div>
                            <button onClick={() => dismissToast(toast.id)} className="flex-shrink-0 opacity-50 hover:opacity-100 transition">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

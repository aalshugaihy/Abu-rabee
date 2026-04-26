import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
type Toast = { id: number; message: string; kind: ToastKind };

type ToastContextValue = {
  showToast: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, kind }]);
  }, []);

  const success = useCallback((m: string) => showToast(m, 'success'), [showToast]);
  const error = useCallback((m: string) => showToast(m, 'error'), [showToast]);
  const info = useCallback((m: string) => showToast(m, 'info'), [showToast]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ showToast, success, error, info }), [showToast, success, error, info]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 end-4 z-[60] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const styles =
    toast.kind === 'success'
      ? { container: 'border-emerald-200 bg-emerald-50 text-emerald-800', Icon: CheckCircle2 }
      : toast.kind === 'error'
      ? { container: 'border-rose-200 bg-rose-50 text-rose-800', Icon: AlertTriangle }
      : { container: 'border-sky-200 bg-sky-50 text-sky-800', Icon: Info };
  const { container, Icon } = styles;

  return (
    <div
      className={`pointer-events-auto min-w-[260px] max-w-sm rounded-xl border ${container} shadow-card px-4 py-3 flex items-start gap-3 animate-slide-up`}
      role="status"
    >
      <Icon size={18} className="shrink-0 mt-0.5" />
      <span className="text-sm font-medium flex-1">{toast.message}</span>
      <button type="button" onClick={onDismiss} className="rounded-md p-1 hover:bg-white/40 -m-1" aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

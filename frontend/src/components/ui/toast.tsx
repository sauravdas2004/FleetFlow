import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Toast {
  id: string;
  title: string;
  message?: string;
  type?: 'success' | 'error' | 'info';
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

let toastId = 0;
const listeners: Array<(toast: Toast) => void> = [];

function emit(partial: Omit<Toast, 'id'>) {
  const t: Toast = { ...partial, id: String(++toastId) };
  listeners.forEach((l) => l(t));
}

export const toast = {
  success: (title: string, message?: string) => emit({ title, message, type: 'success' }),
  error: (title: string, message?: string) => emit({ title, message, type: 'error' }),
  info: (title: string, message?: string) => emit({ title, message, type: 'info' }),
};

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((toastItem) => {
          const Icon = icons[toastItem.type || 'info'];
          return (
            <motion.div
              key={toastItem.id}
              initial={{ opacity: 0, x: 100, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              className={cn(
                'glass rounded-xl p-4 shadow-xl flex items-start gap-3 min-w-[300px]',
                toastItem.type === 'success' && 'border-green-500/20',
                toastItem.type === 'error' && 'border-red-500/20'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 shrink-0 mt-0.5',
                  toastItem.type === 'success' && 'text-green-500',
                  toastItem.type === 'error' && 'text-red-500',
                  toastItem.type === 'info' && 'text-primary'
                )}
              />
              <div className="flex-1">
                <p className="font-medium text-sm">{toastItem.title}</p>
                {toastItem.message && (
                  <p className="text-xs text-muted-foreground mt-0.5">{toastItem.message}</p>
                )}
              </div>
              <button onClick={() => onRemove(toastItem.id)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4000);
    };
    listeners.push(handler);
    return () => {
      const idx = listeners.indexOf(handler);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return { toasts, remove };
}

import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toast, setToastFn } from './Toast';

interface ToastItem { id: number; message: string; type: 'success'|'error'|'info'; }

let _nextId = 0; // module-level so it never resets on re-render

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: 'success'|'error'|'info' = 'success') => {
    const id = _nextId++;
    setToasts(t => [...t.slice(-4), { id, message, type }]); // max 5 toasts at once
  }, []);

  setToastFn(addToast);

  const remove = useCallback((id: number) => setToasts(t => t.filter(x => x.id !== id)), []);

  return (
    <>
      {children}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <Toast message={t.message} type={t.type} onClose={() => remove(t.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

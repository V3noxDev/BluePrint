import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastKind = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  hint?: string;
}
interface ToastCtx {
  push: (t: Omit<Toast, 'id'>) => void;
}

const Ctx = createContext<ToastCtx>({ push: () => {} });

export function useToasts() {
  return useContext(Ctx);
}

export const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback<ToastCtx['push']>((t) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...t, id }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4200);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="mchub-toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`mchub-toast ${t.kind}`}>
            <span className="mchub-toast-icon" aria-hidden>
              {t.kind === 'success' ? '✓' : t.kind === 'error' ? '!' : 'i'}
            </span>
            <div>
              <div>{t.title}</div>
              {t.hint ? <small>{t.hint}</small> : null}
            </div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
};

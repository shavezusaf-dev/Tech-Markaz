import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext();

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg, type = 'info', title) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, msg, type, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, type === 'err' ? 6000 : 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto bg-surface text-ink border-l-4 px-4 py-3.5 rounded-xl shadow-xl flex gap-3 items-start animate-toast-in ${
              t.type === 'ok' ? 'border-ok' :
              t.type === 'err' ? 'border-bad' :
              t.type === 'warn' ? 'border-warn' : 'border-brand'
            }`}
          >
            <div className="flex-1">
              <strong className="block text-[11px] font-extrabold uppercase tracking-wide mb-0.5">
                {t.title || { ok: 'Success', err: 'Error', warn: 'Warning', info: 'Notice' }[t.type]}
              </strong>
              <span className="text-ink-2 text-[13.5px]">{t.msg}</span>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode, type CSSProperties } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  toast: (toast: { type: ToastType; message: string }) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(({ type, message }: { type: ToastType; message: string }) => {
    const id = crypto.randomUUID?.() ?? `${type}-${Date.now()}`;
    setToasts((current) => [...current, { id, type, message }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  const value = useMemo(() => ({ toast: addToast }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={containerStyles}>
        {toasts.map((toast) => (
          <div key={toast.id} className="card" style={{ ...toastStyles, ...typeStyles[toast.type] }}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToastContext must be used within ToastProvider");
  return ctx;
}

const containerStyles: CSSProperties = {
  position: "fixed",
  top: 16,
  right: 16,
  display: "grid",
  gap: 10,
  zIndex: 1000,
};

const toastStyles: CSSProperties = {
  padding: 12,
  borderRadius: 12,
  minWidth: 200,
  fontWeight: 700,
};

const typeStyles: Record<ToastType, CSSProperties> = {
  success: { border: "1px solid rgba(34,197,94,.4)", background: "rgba(34,197,94,.1)", color: "var(--green-900)" },
  error: { border: "1px solid rgba(220,38,38,.4)", background: "rgba(220,38,38,.1)", color: "rgba(153,27,27,1)" },
  info: { border: "1px solid rgba(59,130,246,.4)", background: "rgba(59,130,246,.1)", color: "rgb(30,64,175)" },
};

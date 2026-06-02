"use client";

import { useEffect, useRef, useState } from "react";
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from "./toast";

export type ToastMessage = {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
};

// Global event bus
type Listener = (t: ToastMessage) => void;
const listeners: Listener[] = [];
export function emitToast(t: Omit<ToastMessage, "id">) {
  const msg = { ...t, id: Math.random().toString(36).slice(2) };
  listeners.forEach((l) => l(msg));
}

export function toast(title: string, opts?: { description?: string; variant?: "default" | "destructive" | "success" }) {
  emitToast({ title, ...opts });
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const ref = useRef(false);

  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const handler = (t: ToastMessage) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4000);
    };
    listeners.push(handler);
    return () => {
      const i = listeners.indexOf(handler);
      if (i > -1) listeners.splice(i, 1);
    };
  }, []);

  return (
    <ToastProvider>
      {toasts.map((t) => (
        <Toast key={t.id} variant={t.variant} open>
          <div>
            <ToastTitle>{t.title}</ToastTitle>
            {t.description && <ToastDescription>{t.description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}

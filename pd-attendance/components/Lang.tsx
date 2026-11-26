"use client";
import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from "react";

export type Lang = "both" | "en" | "hi";
const KEY = "pd-lang";
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
const read = (): Lang => {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "en" || v === "hi" || v === "both") return v;
  } catch {}
  return "both";
};

const C = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "both", setLang: () => {} });
export const useLang = () => useContext(C);

export function LangProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, read, () => "both" as Lang);
  const setLang = useCallback((l: Lang) => {
    try { localStorage.setItem(KEY, l); } catch {}
    listeners.forEach((f) => f());
  }, []);
  return <C.Provider value={{ lang, setLang }}>{children}</C.Provider>;
}

"use client";
import type { ReactNode } from "react";

export function Modal({ title, onClose, children }: { title: ReactNode; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-4 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-lg px-3 py-1 text-2xl text-slate-500" aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const inputCls = "w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-3 text-lg focus:border-amber-500 focus:outline-none";
export const btnPrimary = "w-full rounded-xl bg-amber-500 px-4 py-4 text-lg font-bold text-slate-900 active:bg-amber-600 disabled:opacity-50";
export const btnGhost = "rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-800 active:bg-slate-100";

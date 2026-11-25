"use client";
import { useState } from "react";
import { useData } from "../DataProvider";
import { Modal, btnPrimary, inputCls } from "../Modal";
import { T } from "../T";
import { newId } from "@/lib/id";
import { dateLabel, today } from "@/lib/dates";
import { isLow, stockOf } from "@/lib/stock";
import type { Material } from "@/lib/types";

const UNITS = ["bags", "trucks", "kg", "pcs", "ton"];
const fmt = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

export function StockTab({ siteId }: { siteId: string }) {
  const { snap, put, del } = useData();
  const [addingMat, setAddingMat] = useState(false);
  const [entry, setEntry] = useState<{ m: Material; type: "IN" | "OUT" } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const materials = snap.materials.filter((m) => m.site_id === siteId).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <button className={`${btnPrimary} mb-3`} onClick={() => setAddingMat(true)}>＋ Add material</button>
      {materials.length === 0 && <p className="rounded-xl bg-white p-6 text-center text-slate-600">No materials yet. Add Cement, Sand, Bricks, Steel…</p>}
      <ul className="space-y-3">
        {materials.map((m) => {
          const q = stockOf(m, snap);
          const low = isLow(m, snap);
          const history = snap.stock.filter((e) => e.material_id === m.id).sort((a, b) => b.date.localeCompare(a.date));
          return (
            <li key={m.id} className={`rounded-xl bg-white p-3 shadow-sm ${low ? "ring-2 ring-red-500" : ""}`}>
              <button className="flex w-full items-center justify-between text-left" onClick={() => setOpen(open === m.id ? null : m.id)}>
                <div>
                  <div className="text-lg font-bold">{m.name}</div>
                  {low && <div className="text-sm font-bold text-red-700">⚠ <T k="lowStock" /> (limit {fmt(m.low_stock_limit)})</div>}
                </div>
                <div className={`text-2xl font-extrabold ${low ? "text-red-700" : ""}`}>{fmt(q)} <span className="text-base font-semibold text-slate-500">{m.unit}</span></div>
              </button>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="rounded-xl bg-green-600 py-3 text-base font-bold text-white active:bg-green-700" onClick={() => setEntry({ m, type: "IN" })}>＋ <T k="stockIn" hi={false} /></button>
                <button className="rounded-xl bg-orange-500 py-3 text-base font-bold text-white active:bg-orange-600" onClick={() => setEntry({ m, type: "OUT" })}>－ <T k="stockOut" hi={false} /></button>
              </div>
              {open === m.id && (
                <div className="mt-3 border-t pt-2 text-sm">
                  {history.length === 0 && <p className="text-slate-500">No entries yet.</p>}
                  {history.slice(0, 30).map((e) => (
                    <div key={e.id} className="flex items-center justify-between py-1">
                      <span>{dateLabel(e.date)}{e.note && ` · ${e.note}`}</span>
                      <span className={`font-bold ${e.type === "IN" ? "text-green-700" : "text-orange-600"}`}>
                        {e.type === "IN" ? "+" : "−"}{fmt(e.quantity)}
                        <button className="ml-2 text-slate-400" onClick={() => confirm("Delete this entry?") && del("stock", e.id)} aria-label="Delete entry">✕</button>
                      </span>
                    </div>
                  ))}
                  <button className="mt-2 text-red-600 underline" onClick={() => confirm(`Delete ${m.name} and all its entries?`) && del("materials", m.id)}>Delete material</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {addingMat && <MaterialForm siteId={siteId} onClose={() => setAddingMat(false)} onSave={(m) => put("materials", m)} />}
      {entry && <EntryForm {...entry} current={stockOf(entry.m, snap)} onClose={() => setEntry(null)} onSave={(e) => put("stock", e)} />}
    </div>
  );
}

function MaterialForm({ siteId, onClose, onSave }: { siteId: string; onClose: () => void; onSave: (m: Material) => Promise<void> }) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("bags");
  const [low, setLow] = useState("");
  return (
    <Modal title="Add material" onClose={onClose}>
      <form className="space-y-3" onSubmit={async (e) => {
        e.preventDefault();
        await onSave({ id: newId(), site_id: siteId, name: name.trim(), unit: unit.trim() || "pcs", low_stock_limit: Number(low) || 0 });
        onClose();
      }}>
        <label className="block text-sm font-semibold">Material name
          <input className={inputCls} autoFocus placeholder="Cement" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <div>
          <div className="text-sm font-semibold">Unit</div>
          <div className="mt-1 flex flex-wrap gap-2">
            {UNITS.map((u) => (
              <button type="button" key={u} onClick={() => setUnit(u)} className={`rounded-xl border-2 px-4 py-3 font-semibold ${unit === u ? "border-amber-500 bg-amber-100" : "border-slate-300 bg-white"}`}>{u}</button>
            ))}
          </div>
          <input className={`${inputCls} mt-2`} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Other unit…" />
        </div>
        <label className="block text-sm font-semibold">Warn me when stock is at or below (optional)
          <input className={inputCls} inputMode="decimal" value={low} onChange={(e) => setLow(e.target.value.replace(/[^\d.]/g, ""))} />
        </label>
        <button className={btnPrimary} disabled={!name.trim()}><T k="save" /></button>
      </form>
    </Modal>
  );
}

function EntryForm({ m, type, current, onClose, onSave }: { m: Material; type: "IN" | "OUT"; current: number; onClose: () => void; onSave: (e: import("@/lib/types").StockEntry) => Promise<void> }) {
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today());
  const q = Number(qty);
  const tooMuch = type === "OUT" && q > current;
  return (
    <Modal title={`${m.name} – ${type === "IN" ? "Stock IN (came)" : "Stock OUT (used)"}`} onClose={onClose}>
      <form className="space-y-3" onSubmit={async (e) => {
        e.preventDefault();
        if (tooMuch && !confirm(`Only ${fmt(current)} ${m.unit} in stock. Record anyway?`)) return;
        await onSave({ id: newId(), material_id: m.id, date, type, quantity: q, note: note.trim() });
        onClose();
      }}>
        <label className="block text-sm font-semibold">Quantity ({m.unit})
          <input className={`${inputCls} text-2xl font-bold`} inputMode="decimal" autoFocus value={qty} onChange={(e) => setQty(e.target.value.replace(/[^\d.]/g, ""))} />
        </label>
        {tooMuch && <p className="rounded-lg bg-orange-100 p-2 text-sm font-semibold text-orange-800">Only {fmt(current)} {m.unit} in stock.</p>}
        <label className="block text-sm font-semibold">Date
          <input type="date" className={inputCls} value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="block text-sm font-semibold">Note (optional)
          <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button className={`${btnPrimary} ${type === "IN" ? "!bg-green-600 !text-white" : ""}`} disabled={!(q > 0)}><T k="save" /></button>
      </form>
    </Modal>
  );
}

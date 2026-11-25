"use client";
import { useState } from "react";
import { Modal, btnPrimary, inputCls } from "./Modal";
import { T } from "./T";
import { useData } from "./DataProvider";
import type { Worker } from "@/lib/types";

const TYPES = ["Mason", "Labour", "Helper"];

export function WorkerForm({ worker, onClose }: { worker?: Worker; onClose: () => void }) {
  const { saveWorker, isAdmin, snap } = useData();
  const [name, setName] = useState(worker?.name ?? "");
  const [type, setType] = useState(worker?.type ?? "Labour");
  const [wage, setWage] = useState(String(worker?.daily_wage ?? ""));
  const [phone, setPhone] = useState(worker?.phone ?? "");
  const [active, setActive] = useState(worker?.active ?? true);
  const [siteId, setSiteId] = useState(worker?.default_site_id ?? "");
  const types = Array.from(new Set([...TYPES, ...snap.workers.map((w) => w.type)]));
  const valid = name.trim() && (!isAdmin || Number(wage) > 0 || !!worker);

  return (
    <Modal title={<T k={worker ? "editWorker" : "addWorker"} />} onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          await saveWorker({
            id: worker?.id,
            name: name.trim(),
            type: type.trim() || "Labour",
            daily_wage: isAdmin ? Number(wage) || 0 : worker?.daily_wage ?? 0,
            phone: phone.trim(),
            active,
            default_site_id: siteId || null,
          });
          onClose();
        }}
      >
        <label className="block text-sm font-semibold"><T k="name" />
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </label>
        <div>
          <div className="text-sm font-semibold"><T k="type" /></div>
          <div className="mt-1 flex flex-wrap gap-2">
            {types.map((t) => (
              <button type="button" key={t} onClick={() => setType(t)} className={`rounded-xl border-2 px-4 py-3 text-base font-semibold ${type === t ? "border-amber-500 bg-amber-100" : "border-slate-300 bg-white"}`}>{t}</button>
            ))}
          </div>
          <input className={`${inputCls} mt-2`} value={type} onChange={(e) => setType(e.target.value)} placeholder="Other type…" />
        </div>
        {isAdmin && (
          <label className="block text-sm font-semibold"><T k="wage" /> (₹)
            <input className={inputCls} inputMode="numeric" value={wage} onChange={(e) => setWage(e.target.value.replace(/[^\d.]/g, ""))} />
            {worker && <span className="text-xs font-normal text-slate-500">Changing the wage applies from today. Old days keep the old wage.</span>}
          </label>
        )}
        <label className="block text-sm font-semibold"><T k="phone" />
          <input className={inputCls} inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        {snap.sites.length > 0 && (
          <label className="block text-sm font-semibold">Site (optional)
            <select className={inputCls} value={siteId} onChange={(e) => setSiteId(e.target.value)}>
              <option value="">— none —</option>
              {snap.sites.filter((s) => s.status !== "Finished" || s.id === siteId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        )}
        {worker && (
          <label className="flex items-center gap-3 text-base font-semibold">
            <input type="checkbox" className="h-6 w-6" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active (untick when the worker has left)
          </label>
        )}
        <button className={btnPrimary} disabled={!valid}><T k="save" /></button>
      </form>
    </Modal>
  );
}

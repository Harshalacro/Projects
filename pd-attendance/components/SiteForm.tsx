"use client";
import { useState } from "react";
import { Modal, btnPrimary, inputCls } from "./Modal";
import { T } from "./T";
import { useData } from "./DataProvider";
import { newId } from "@/lib/id";
import { today } from "@/lib/dates";
import type { Site, SiteStatus } from "@/lib/types";

const STATUSES: SiteStatus[] = ["Running", "On hold", "Finished"];

export function SiteForm({ site, onClose }: { site?: Site; onClose: () => void }) {
  const { put } = useData();
  const [name, setName] = useState(site?.name ?? "");
  const [address, setAddress] = useState(site?.address ?? "");
  const [start, setStart] = useState(site?.start_date ?? today());
  const [status, setStatus] = useState<SiteStatus>(site?.status ?? "Running");
  return (
    <Modal title={<T k={site ? "editWorker" : "addSite"} hi={!site} />} onClose={onClose}>
      <form className="space-y-3" onSubmit={async (e) => {
        e.preventDefault();
        await put("sites", { id: site?.id ?? newId(), name: name.trim(), address: address.trim(), start_date: start, status });
        onClose();
      }}>
        <label className="block text-sm font-semibold">Site name (e.g. Balaji Colony)
          <input className={inputCls} autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block text-sm font-semibold">Address
          <input className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)} />
        </label>
        <label className="block text-sm font-semibold">Start date
          <input type="date" className={inputCls} value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <div className="flex gap-2">
          {STATUSES.map((s) => (
            <button type="button" key={s} onClick={() => setStatus(s)} className={`flex-1 rounded-xl border-2 px-2 py-3 text-sm font-bold ${status === s ? "border-amber-500 bg-amber-100" : "border-slate-300 bg-white"}`}>{s}</button>
          ))}
        </div>
        <button className={btnPrimary} disabled={!name.trim()}><T k="save" /></button>
      </form>
    </Modal>
  );
}

export const STATUS_BADGE: Record<SiteStatus, string> = {
  Running: "bg-green-100 text-green-800",
  "On hold": "bg-orange-100 text-orange-800",
  Finished: "bg-slate-200 text-slate-700",
};

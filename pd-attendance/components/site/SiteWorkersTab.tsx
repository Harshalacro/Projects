"use client";
import { useState } from "react";
import { Icon } from "../Icon";
import { useData } from "../DataProvider";
import { Modal, btnPrimary } from "../Modal";
import { StatusButtons } from "../StatusButtons";
import { T } from "../T";
import { today } from "@/lib/dates";
import Link from "next/link";

/** Workers assigned to this site, with today's attendance (same data as the Attendance screen). */
export function SiteWorkersTab({ siteId }: { siteId: string }) {
  const { snap, saveWorker, setAttendance } = useData();
  const [picking, setPicking] = useState(false);
  const d = today();
  const here = snap.workers.filter((w) => w.active && w.default_site_id === siteId).sort((a, b) => a.name.localeCompare(b.name));
  const others = snap.workers.filter((w) => w.active && w.default_site_id !== siteId).sort((a, b) => a.name.localeCompare(b.name));
  const status = (id: string) => snap.attendance.find((a) => a.worker_id === id && a.date === d)?.status;
  const siteName = (id: string | null) => snap.sites.find((s) => s.id === id)?.name;

  return (
    <div>
      <button className={`${btnPrimary} mb-3`} onClick={() => setPicking(true)}><Icon name="plus" /> <T k="assign" /></button>
      <p className="mb-2 text-sm font-semibold text-slate-600">Today’s attendance · {here.filter((w) => status(w.id) === "P" || status(w.id) === "H").length} of {here.length} present</p>
      {here.length === 0 && <p className="card p-6 text-center text-slate-600">No workers assigned to this site yet.</p>}
      <ul className="space-y-2">
        {here.map((w) => (
          <li key={w.id} className="flex items-center justify-between gap-2 card p-3 shadow-sm">
            <Link href={`/workers/${w.id}`} className="min-w-0 flex-1">
              <div className="truncate text-lg font-bold">{w.name}</div>
              <div className="text-sm text-slate-500">{w.type}</div>
            </Link>
            <StatusButtons value={status(w.id)} onChange={(s) => setAttendance(w.id, d, s)} />
          </li>
        ))}
      </ul>
      {picking && (
        <Modal title="Assign workers" onClose={() => setPicking(false)}>
          <p className="mb-2 text-sm text-slate-600">Tap a worker to add or remove them from this site. A worker can be on one site at a time.</p>
          <ul className="space-y-2">
            {[...here, ...others].map((w) => {
              const on = w.default_site_id === siteId;
              return (
                <li key={w.id}>
                  <button
                    onClick={() => saveWorker({ ...w, default_site_id: on ? null : siteId })}
                    className={`flex w-full items-center justify-between rounded-xl border-2 p-3 text-left ${on ? "border-green-600 bg-green-50" : "border-slate-300"}`}
                  >
                    <span>
                      <span className="block text-lg font-bold">{w.name}</span>
                      <span className="text-sm text-slate-500">{w.type}{!on && w.default_site_id && ` · now at ${siteName(w.default_site_id) ?? "another site"}`}</span>
                    </span>
                    <span className={`flex h-8 w-8 items-center justify-center ${on ? "text-green-700" : ""}`}>{on ? <Icon name="check" className="h-6 w-6" strokeWidth={3} /> : <span className="block h-5 w-5 rounded-full border-2 border-slate-300" />}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button className={`${btnPrimary} mt-3`} onClick={() => setPicking(false)}>Done</button>
        </Modal>
      )}
    </div>
  );
}

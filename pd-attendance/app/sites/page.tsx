"use client";
import Link from "next/link";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { useData } from "@/components/DataProvider";
import { SiteForm, STATUS_BADGE } from "@/components/SiteForm";
import { T } from "@/components/T";
import { btnPrimary } from "@/components/Modal";
import { isLow } from "@/lib/stock";
import { today } from "@/lib/dates";

export default function SitesPage() {
  const { snap } = useData();
  const [adding, setAdding] = useState(false);
  const order = { Running: 0, "On hold": 1, Finished: 2 } as const;
  const sites = [...snap.sites].sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name));
  return (
    <Shell title={<T k="sites" />}>
      <button className={`${btnPrimary} mb-3`} onClick={() => setAdding(true)}>＋ <T k="addSite" /></button>
      {sites.length === 0 && <p className="rounded-xl bg-white p-6 text-center text-slate-600">No sites yet. Add your first site (e.g. Balaji Colony).</p>}
      <ul className="space-y-3">
        {sites.map((s) => {
          const open = snap.reminders.filter((r) => r.site_id === s.id && !r.done);
          const overdue = open.filter((r) => r.due_date < today()).length;
          const low = snap.materials.filter((m) => m.site_id === s.id && isLow(m, snap)).length;
          const workers = snap.workers.filter((w) => w.default_site_id === s.id && w.active).length;
          return (
            <li key={s.id}>
              <Link href={`/sites/${s.id}`} className="block rounded-xl bg-white p-4 shadow-sm active:bg-amber-50">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-xl font-bold">{s.name}</div>
                    <div className="truncate text-sm text-slate-500">{s.address || "—"}</div>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${STATUS_BADGE[s.status]}`}>{s.status}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
                  <span className="rounded-lg bg-slate-100 px-2 py-1">👷 {workers}</span>
                  <span className={`rounded-lg px-2 py-1 ${overdue ? "bg-red-100 text-red-700" : "bg-slate-100"}`}>⏰ {open.length}{overdue ? ` (${overdue} overdue)` : ""}</span>
                  {low > 0 && <span className="rounded-lg bg-red-100 px-2 py-1 text-red-700">⚠ {low} low stock</span>}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      {adding && <SiteForm onClose={() => setAdding(false)} />}
    </Shell>
  );
}

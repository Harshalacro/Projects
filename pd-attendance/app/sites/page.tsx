"use client";
import Link from "next/link";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { useData } from "@/components/DataProvider";
import { SiteForm, STATUS_BADGE } from "@/components/SiteForm";
import { Icon } from "@/components/Icon";
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
      <button className={`${btnPrimary} mb-4`} onClick={() => setAdding(true)}><Icon name="plus" /> <T k="addSite" /></button>
      {sites.length === 0 && <p className="card p-8 text-center text-slate-500">No sites yet. Add your first site (e.g. Balaji Colony).</p>}
      <ul className="grid gap-3 md:grid-cols-2">
        {sites.map((s) => {
          const open = snap.reminders.filter((r) => r.site_id === s.id && !r.done);
          const overdue = open.filter((r) => r.due_date < today()).length;
          const low = snap.materials.filter((m) => m.site_id === s.id && isLow(m, snap)).length;
          const workers = snap.workers.filter((w) => w.default_site_id === s.id && w.active).length;
          return (
            <li key={s.id}>
              <Link href={`/sites/${s.id}`} className="card block p-4 transition hover:ring-slate-300 active:bg-amber-50">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 truncate text-lg font-bold"><Icon name="building" className="h-5 w-5 shrink-0 text-slate-400" />{s.name}</div>
                    <div className="mt-0.5 flex items-center gap-1 truncate pl-7 text-sm text-slate-500">{s.address || "—"}</div>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${STATUS_BADGE[s.status]}`}>{s.status}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
                  <Chip icon="users">{workers} workers</Chip>
                  <Chip icon="bell" bad={overdue > 0}>{open.length} to do{overdue ? ` · ${overdue} overdue` : ""}</Chip>
                  {low > 0 && <Chip icon="alert" bad>{low} low stock</Chip>}
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

function Chip({ icon, bad, children }: { icon: "users" | "bell" | "alert"; bad?: boolean; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${bad ? "bg-red-50 text-red-700 ring-1 ring-red-200" : "bg-slate-100 text-slate-700"}`}>
      <Icon name={icon} className="h-3.5 w-3.5" /> {children}
    </span>
  );
}

"use client";
import Link from "next/link";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { useData } from "@/components/DataProvider";
import { WorkerForm } from "@/components/WorkerForm";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { T } from "@/components/T";
import { btnPrimary, inputCls } from "@/components/Modal";
import { rupees } from "@/lib/calc";

export default function WorkersPage() {
  const { snap, isAdmin } = useData();
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const list = [...snap.workers]
    .filter((w) => w.name.toLowerCase().includes(q.toLowerCase()) || w.type.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));
  const siteName = (id: string | null) => snap.sites.find((s) => s.id === id)?.name;
  return (
    <Shell title={<T k="workers" />}>
      <div className="mb-4 flex gap-2">
        <input className={`${inputCls} !mt-0 flex-1`} placeholder="Search name or type…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search workers" />
        <button className={`${btnPrimary} !w-auto px-5`} onClick={() => setAdding(true)}><Icon name="plus" /> <span className="hidden sm:inline"><T k="addWorker" hi={false} /></span><span className="sm:hidden">Add</span></button>
      </div>
      {list.length === 0 && <div className="card p-8 text-center text-slate-500">{snap.workers.length ? "No match." : "No workers yet. Tap Add to create the first one."}</div>}
      <ul className="space-y-2">
        {list.map((w) => (
          <li key={w.id}>
            <Link href={`/workers/${w.id}`} className={`card flex items-center gap-3 p-3 transition hover:ring-slate-300 ${w.active ? "" : "opacity-55"}`}>
              <Avatar name={w.name} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-bold">{w.name} {!w.active && <span className="ml-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600">Left</span>}</div>
                <div className="truncate text-sm text-slate-500">{w.type}{siteName(w.default_site_id) && ` · ${siteName(w.default_site_id)}`}{w.phone && ` · ${w.phone}`}</div>
              </div>
              {isAdmin && <div className="text-right"><div className="text-base font-bold">{rupees(w.daily_wage)}</div><div className="text-[11px] text-slate-500">per day</div></div>}
              <Icon name="right" className="h-5 w-5 text-slate-300" />
            </Link>
          </li>
        ))}
      </ul>
      {adding && <WorkerForm onClose={() => setAdding(false)} />}
    </Shell>
  );
}

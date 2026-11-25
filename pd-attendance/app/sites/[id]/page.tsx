"use client";
import { use, useState } from "react";
import { Shell } from "@/components/Shell";
import { useData } from "@/components/DataProvider";
import { SiteForm, STATUS_BADGE } from "@/components/SiteForm";
import { T } from "@/components/T";
import { btnGhost } from "@/components/Modal";
import { ReportsTab } from "@/components/site/ReportsTab";
import { RemindersTab } from "@/components/site/RemindersTab";
import { StockTab } from "@/components/site/StockTab";
import { SiteWorkersTab } from "@/components/site/SiteWorkersTab";
import { isLow } from "@/lib/stock";
import { today } from "@/lib/dates";
import type { LabelKey } from "@/lib/i18n";

const TABS: { id: "report" | "reminders" | "stock" | "workers"; key: LabelKey }[] = [
  { id: "report", key: "dailyReport" },
  { id: "reminders", key: "reminders" },
  { id: "stock", key: "stock" },
  { id: "workers", key: "workersOnSite" },
];

export default function SitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { snap, del } = useData();
  const site = snap.sites.find((s) => s.id === id);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("report");
  const [editing, setEditing] = useState(false);

  if (!site) return <Shell title="Site" back="/sites"><p className="p-6 text-center text-slate-500">{snap.sites.length ? "Site not found." : "Loading…"}</p></Shell>;

  const overdue = snap.reminders.filter((r) => r.site_id === id && !r.done && r.due_date < today()).length;
  const low = snap.materials.filter((m) => m.site_id === id && isLow(m, snap)).length;
  const badge: Record<string, number> = { reminders: overdue, stock: low };

  return (
    <Shell title={site.name} back="/sites">
      <div className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-white p-3 shadow-sm">
        <div className="min-w-0 text-sm text-slate-600">
          <div className="truncate">{site.address || "No address"}</div>
          <span className={`mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-bold ${STATUS_BADGE[site.status]}`}>{site.status}</span>
        </div>
        <button className={btnGhost} onClick={() => setEditing(true)}>Edit</button>
      </div>

      <div className="mb-3 grid grid-cols-4 gap-1 rounded-xl bg-slate-300 p-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`relative rounded-lg px-1 py-3 text-[13px] font-bold leading-tight ${tab === t.id ? "bg-amber-500 text-slate-900" : "bg-white text-slate-700"}`}>
            <T k={t.key} hi={false} />
            {badge[t.id] > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 text-xs text-white">{badge[t.id]}</span>}
          </button>
        ))}
      </div>

      {tab === "report" && <ReportsTab siteId={id} />}
      {tab === "reminders" && <RemindersTab siteId={id} />}
      {tab === "stock" && <StockTab siteId={id} />}
      {tab === "workers" && <SiteWorkersTab siteId={id} />}

      {editing && <SiteForm site={site} onClose={() => setEditing(false)} />}
      <button
        className="mt-6 w-full text-center text-sm text-red-600 underline"
        onClick={async () => {
          if (confirm(`Delete site "${site.name}" with all its reports, reminders and stock? This cannot be undone.`)) {
            await del("sites", id);
            history.back();
          }
        }}
      >Delete this site</button>
    </Shell>
  );
}

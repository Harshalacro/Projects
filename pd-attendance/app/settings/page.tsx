"use client";
import { Shell } from "@/components/Shell";
import { useData } from "@/components/DataProvider";
import { useLang, type Lang } from "@/components/Lang";
import { Icon, type IconName } from "@/components/Icon";
import { T } from "@/components/T";
import { btnGhost } from "@/components/Modal";
import { exportBackup } from "@/lib/export";

const LANGS: { id: Lang; label: string }[] = [
  { id: "both", label: "English + हिंदी" },
  { id: "en", label: "English" },
  { id: "hi", label: "हिंदी" },
];

export default function SettingsPage() {
  const { profile, mode, snap, online, pending, signOut, resetDemo } = useData();
  const { lang, setLang } = useLang();
  return (
    <Shell title={<T k="settings" />}>
      <div className="mx-auto max-w-xl space-y-4">
        <div className="card p-4">
          <div className="section-title">Account</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold">{profile?.name}</div>
              <div className="text-sm capitalize text-slate-500">{profile?.role}{profile?.role === "supervisor" && " · wages hidden"}</div>
            </div>
            <button className={btnGhost} onClick={signOut}><Icon name="logout" className="h-5 w-5" /> <T k="logout" hi={false} /></button>
          </div>
        </div>

        <div className="card p-4">
          <div className="section-title flex items-center gap-1.5"><Icon name="globe" className="h-4 w-4" /> <T k="language" hi={false} /></div>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
            {LANGS.map((l) => (
              <button key={l.id} onClick={() => setLang(l.id)} className={`rounded-lg px-1 py-2.5 text-sm font-bold ${lang === l.id ? "bg-white text-slate-900 shadow" : "text-slate-500"}`}>{l.label}</button>
            ))}
          </div>
          <p className="hint mt-2">Changes the labels on buttons and headings.</p>
        </div>

        <div className="card p-4">
          <div className="section-title">Data & sync</div>
          <Line icon={mode === "demo" ? "info" : online ? "cloud" : "wifioff"} title={mode === "demo" ? "Demo mode" : online ? "Online" : "Offline"}
            text={mode === "demo" ? "Data is saved only in this browser. Add the Supabase keys to share data between phones." : pending ? `${pending} change${pending > 1 ? "s" : ""} saved on this phone, waiting to sync.` : "Everything is saved to the cloud. You can keep working with no signal — it syncs automatically."} />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button className={btnGhost} onClick={() => exportBackup(snap)}><Icon name="download" className="h-5 w-5" /> Download backup</button>
            {mode === "demo" && <button className={`${btnGhost} !text-red-700`} onClick={() => confirm("Delete all demo data and start again with the sample data?") && resetDemo()}><Icon name="trash" className="h-5 w-5" /> Reset demo data</button>}
          </div>
        </div>

        <p className="pb-2 text-center text-xs text-slate-400">P&amp;D Construction Private Limited · Attendance &amp; Site Management</p>
      </div>
    </Shell>
  );
}

function Line({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"><Icon name={icon} /></div>
      <div><div className="font-bold">{title}</div><div className="text-sm text-slate-500">{text}</div></div>
    </div>
  );
}

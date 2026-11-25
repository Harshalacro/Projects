"use client";
import { useRef, useState } from "react";
import { useData } from "../DataProvider";
import { Modal, btnGhost, btnPrimary, inputCls } from "../Modal";
import { T } from "../T";
import { newId } from "@/lib/id";
import { compressImage } from "@/lib/image";
import { dateLabel, today } from "@/lib/dates";
import type { DailyReport } from "@/lib/types";

export function ReportsTab({ siteId }: { siteId: string }) {
  const { snap, deleteReport } = useData();
  const [editing, setEditing] = useState<DailyReport | "new" | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const reports = snap.reports.filter((r) => r.site_id === siteId).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <button className={`${btnPrimary} mb-3`} onClick={() => setEditing("new")}>＋ Write today’s report</button>
      {reports.length === 0 && <p className="rounded-xl bg-white p-6 text-center text-slate-600">No reports yet.</p>}
      <ul className="space-y-3">
        {reports.map((r) => (
          <li key={r.id} className="rounded-xl bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="font-bold">{dateLabel(r.date)}</div>
              <div className="rounded-lg bg-slate-100 px-2 py-1 text-sm font-semibold">👷 {r.workers_count}</div>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-base">{r.notes || <span className="text-slate-400">No notes</span>}</p>
            {r.photos.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {r.photos.map((p, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={p} alt="Site photo" className="aspect-square w-full rounded-lg object-cover" onClick={() => setZoom(p)} />
                ))}
              </div>
            )}
            <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
              <span>{r.created_by && `by ${r.created_by}`}</span>
              <span className="flex gap-4">
                <button className="font-semibold text-slate-700 underline" onClick={() => setEditing(r)}>Edit</button>
                <button className="text-red-600 underline" onClick={() => confirm("Delete this report?") && deleteReport(r.id)}>Delete</button>
              </span>
            </div>
          </li>
        ))}
      </ul>
      {editing && <ReportForm siteId={siteId} report={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      {zoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2" onClick={() => setZoom(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="Site photo" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </div>
  );
}

function ReportForm({ siteId, report, onClose }: { siteId: string; report?: DailyReport; onClose: () => void }) {
  const { snap, saveReport, profile } = useData();
  const [date, setDate] = useState(report?.date ?? today());
  const presentOn = (d: string) => {
    const onSite = new Set(snap.workers.filter((w) => w.default_site_id === siteId).map((w) => w.id));
    const anyAssigned = onSite.size > 0;
    return snap.attendance.filter((a) => a.date === d && a.status !== "A" && (!anyAssigned || onSite.has(a.worker_id))).length;
  };
  const [count, setCount] = useState(String(report?.workers_count ?? presentOn(date)));
  const [touched, setTouched] = useState(!!report);
  const [notes, setNotes] = useState(report?.notes ?? "");
  const [photos, setPhotos] = useState<string[]>(report?.photos ?? []);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  async function addFiles(files: FileList | null) {
    if (!files) return;
    setBusy(true);
    try {
      const out = await Promise.all(Array.from(files).map((f) => compressImage(f)));
      setPhotos((p) => [...p, ...out]);
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <Modal title="Daily report" onClose={onClose}>
      <form className="space-y-3" onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        await saveReport({ id: report?.id ?? newId(), site_id: siteId, date, notes: notes.trim(), workers_count: Number(count) || 0, created_by: report?.created_by ?? profile?.name ?? "", photos });
        onClose();
      }}>
        <label className="block text-sm font-semibold">Date
          <input type="date" className={inputCls} value={date} max={today()} onChange={(e) => { setDate(e.target.value); if (!touched) setCount(String(presentOn(e.target.value))); }} />
        </label>
        <label className="block text-sm font-semibold">Work done
          <textarea className={inputCls} rows={4} autoFocus placeholder="Slab shuttering done, plastering started…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <label className="block text-sm font-semibold">How many workers came
          <input className={inputCls} inputMode="numeric" value={count} onChange={(e) => { setTouched(true); setCount(e.target.value.replace(/\D/g, "")); }} />
          {!touched && <span className="text-xs font-normal text-slate-500">Filled from today’s attendance. You can change it.</span>}
        </label>
        <div>
          <div className="text-sm font-semibold">Photos</div>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt="" className="aspect-square w-full rounded-lg object-cover" />
                <button type="button" aria-label="Remove photo" className="absolute right-1 top-1 h-8 w-8 rounded-full bg-black/70 text-white" onClick={() => setPhotos(photos.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
          </div>
          <input ref={file} type="file" accept="image/*" capture="environment" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          <button type="button" className={`${btnGhost} mt-2 w-full`} onClick={() => file.current?.click()} disabled={busy}>📷 Add photo</button>
          {err && <p className="mt-1 text-sm text-red-600">{err}</p>}
        </div>
        <button className={btnPrimary} disabled={busy || (!notes.trim() && photos.length === 0)}>{busy ? "Please wait…" : <T k="save" />}</button>
      </form>
    </Modal>
  );
}

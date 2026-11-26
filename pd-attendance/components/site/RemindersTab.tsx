"use client";
import { useState } from "react";
import { Icon } from "../Icon";
import { useData } from "../DataProvider";
import { Modal, btnPrimary, inputCls } from "../Modal";
import { T } from "../T";
import { newId } from "@/lib/id";
import { addDays, dateLabel, today } from "@/lib/dates";

export function RemindersTab({ siteId }: { siteId: string }) {
  const { snap, put, del } = useData();
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [due, setDue] = useState(today());
  const list = snap.reminders
    .filter((r) => r.site_id === siteId)
    .sort((a, b) => Number(a.done) - Number(b.done) || a.due_date.localeCompare(b.due_date));

  return (
    <div>
      <button className={`${btnPrimary} mb-3`} onClick={() => { setText(""); setDue(today()); setAdding(true); }}><Icon name="plus" /> <T k="addReminder" /></button>
      {list.length === 0 && <p className="card p-6 text-center text-slate-600">No reminders. Add one like “Buy 50 bags cement”.</p>}
      <ul className="space-y-2">
        {list.map((r) => {
          const overdue = !r.done && r.due_date < today();
          return (
            <li key={r.id} className={`flex items-center gap-3 rounded-xl p-3 shadow-sm ${overdue ? "bg-red-50 ring-2 ring-red-400" : "bg-white"}`}>
              <button
                onClick={() => put("reminders", { ...r, done: !r.done })}
                aria-label={r.done ? "Mark not done" : "Mark done"}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 text-2xl font-extrabold ${r.done ? "border-green-600 bg-green-600 text-white" : "border-slate-400 bg-white text-transparent"}`}
              ><Icon name="check" className="h-6 w-6" strokeWidth={3} /></button>
              <div className="min-w-0 flex-1">
                <div className={`text-lg font-semibold ${r.done ? "text-slate-400 line-through" : ""}`}>{r.text}</div>
                <div className={`text-sm ${overdue ? "font-bold text-red-700" : "text-slate-500"}`}>{overdue && "Overdue · "}{dateLabel(r.due_date)}</div>
              </div>
              <button className="px-2 text-xl text-slate-400" aria-label="Delete" onClick={() => confirm("Delete this reminder?") && del("reminders", r.id)}>✕</button>
            </li>
          );
        })}
      </ul>
      {adding && (
        <Modal title="New reminder" onClose={() => setAdding(false)}>
          <form className="space-y-3" onSubmit={async (e) => {
            e.preventDefault();
            await put("reminders", { id: newId(), site_id: siteId, text: text.trim(), due_date: due, done: false });
            setAdding(false);
          }}>
            <label className="label">What to do
              <input className={inputCls} autoFocus placeholder="Buy 50 bags cement" value={text} onChange={(e) => setText(e.target.value)} />
            </label>
            <label className="label">Date
              <input type="date" className={inputCls} value={due} onChange={(e) => setDue(e.target.value)} />
            </label>
            <div className="flex gap-2">
              <button type="button" className="flex-1 rounded-xl border border-slate-300 py-3 font-semibold" onClick={() => setDue(today())}><T k="today" hi={false} /></button>
              <button type="button" className="flex-1 rounded-xl border border-slate-300 py-3 font-semibold" onClick={() => setDue(addDays(today(), 1))}>Tomorrow</button>
            </div>
            <button className={btnPrimary} disabled={!text.trim()}><T k="save" /></button>
          </form>
        </Modal>
      )}
    </div>
  );
}

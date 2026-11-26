import type { Snapshot } from "./types";
import { workerMonth, type MonthResult } from "./calc";
import { daysInMonth, monthLabel } from "./dates";

const COMPANY = "P&D Construction Private Limited";

export interface Row { id: string; name: string; type: string; wage: number; r: MonthResult }

export function summaryRows(snap: Snapshot, month: string): Row[] {
  return snap.workers
    .map((w) => ({ id: w.id, name: w.name, type: w.type, wage: w.daily_wage, active: w.active, r: workerMonth(w, month, snap) }))
    .filter((x) => x.active || x.r.daysWorked > 0 || x.r.advance > 0 || x.r.closing !== 0)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(({ id, name, type, wage, r }) => ({ id, name, type, wage, r }));
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const fileBase = (month: string) => `PD-Attendance-${month}`;
const sum = (rows: Row[], f: (r: MonthResult) => number) => rows.reduce((s, x) => s + f(x.r), 0);

/** PDF of the monthly summary. (₹ is not in the PDF base font, so amounts print as "Rs".) */
export async function exportPdf(rows: Row[], month: string, showMoney: boolean) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFont("helvetica", "bold").setFontSize(16).text(COMPANY, 14, 15);
  doc.setFont("helvetica", "normal").setFontSize(11).text(`Attendance & Payment Summary – ${monthLabel(month)}`, 14, 22);
  const rs = (n: number) => Math.round(n).toLocaleString("en-IN");
  const head = ["#", "Name", "Type", "P", "A", "1/2", "Days", "%", ...(showMoney ? ["Rate", "Total (Rs)", "Advance", "Old bal.", "Balance", "Paid"] : [])];
  const body = rows.map((x, i) => [
    i + 1, x.name, x.type, x.r.present, x.r.absent, x.r.half, x.r.daysWorked, x.r.pct + "%",
    ...(showMoney ? [rs(x.wage), rs(x.r.earned), x.r.advance ? rs(x.r.advance) : "-", x.r.opening ? rs(x.r.opening) : "-", rs(x.r.closing), x.r.isPaid ? "Yes" : ""] : []),
  ]);
  const foot = showMoney ? [["", "Grand total", "", "", "", "", "", "", "", rs(sum(rows, (r) => r.earned)), rs(sum(rows, (r) => r.advance)), rs(sum(rows, (r) => r.opening)), rs(sum(rows, (r) => r.closing)), ""]] : undefined;
  autoTable(doc, {
    startY: 27, head: [head], body, foot,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    footStyles: { fillColor: [254, 243, 199], textColor: 20, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: showMoney ? { 8: { halign: "right" }, 9: { halign: "right" }, 10: { halign: "right" }, 11: { halign: "right" }, 12: { halign: "right", fontStyle: "bold" } } : {},
  });
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i).setFontSize(8).setTextColor(120).text(`Generated ${new Date().toLocaleDateString("en-IN")} · Page ${i} of ${pages}`, 14, 203);
  }
  doc.save(fileBase(month) + ".pdf");
}

/** Excel workbook: a Summary sheet and a Register sheet that looks like the paper register (days 1-31 with P/A/H). */
export async function exportExcel(rows: Row[], month: string, snap: Snapshot, showMoney: boolean) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = COMPANY;
  const dark = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF1E293B" } };
  const headRow = (row: import("exceljs").Row) => { row.font = { bold: true, color: { argb: "FFFFFFFF" } }; row.fill = dark; row.alignment = { horizontal: "center" }; };

  const ws = wb.addWorksheet("Summary");
  ws.addRow([COMPANY]).font = { bold: true, size: 14 };
  ws.addRow([`Attendance & Payment Summary – ${monthLabel(month)}`]);
  ws.addRow([]);
  headRow(ws.addRow(["#", "Name", "Type", "Present", "Absent", "Half days", "Days worked", "Attendance %", ...(showMoney ? ["Daily wage", "Total amount", "Advance", "Old balance", "Balance", "Paid"] : [])]));
  rows.forEach((x, i) => ws.addRow([i + 1, x.name, x.type, x.r.present, x.r.absent, x.r.half, x.r.daysWorked, x.r.pct / 100, ...(showMoney ? [x.wage, x.r.earned, x.r.advance, x.r.opening, x.r.closing, x.r.isPaid ? "Yes" : ""] : [])]));
  if (showMoney) {
    const t = ws.addRow(["", "Grand total", "", "", "", "", "", "", "", sum(rows, (r) => r.earned), sum(rows, (r) => r.advance), sum(rows, (r) => r.opening), sum(rows, (r) => r.closing), ""]);
    t.font = { bold: true };
    t.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
    for (const c of [9, 10, 11, 12, 13]) ws.getColumn(c).numFmt = '#,##0;[Red]-#,##0';
  }
  ws.getColumn(8).numFmt = "0%";
  ws.columns.forEach((c, i) => (c.width = i === 1 ? 22 : i === 0 ? 5 : 13));

  const reg = wb.addWorksheet("Register");
  const n = daysInMonth(month);
  reg.addRow([`${COMPANY} – ${monthLabel(month)}`]).font = { bold: true, size: 14 };
  reg.addRow([]);
  headRow(reg.addRow(["Name", "Type", ...Array.from({ length: n }, (_, i) => i + 1), "Days"]));
  const color: Record<string, string> = { P: "FF16A34A", A: "FFDC2626", H: "FFF97316" };
  for (const x of rows) {
    const row = reg.addRow([x.name, x.type, ...Array.from({ length: n }, (_, i) => (x.r.statusByDay[i + 1] === "H" ? "½" : x.r.statusByDay[i + 1] ?? "")), x.r.daysWorked]);
    row.alignment = { horizontal: "center" };
    row.getCell(1).alignment = { horizontal: "left" };
    for (let d = 1; d <= n; d++) {
      const s = x.r.statusByDay[d];
      if (s) { const c = row.getCell(2 + d); c.font = { bold: true, color: { argb: "FFFFFFFF" } }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color[s] } }; }
    }
  }
  reg.columns.forEach((c, i) => (c.width = i === 0 ? 20 : i === 1 ? 11 : 4.5));
  reg.getColumn(n + 3).width = 7;
  reg.views = [{ state: "frozen", xSplit: 2, ySplit: 3 }];

  const buf = await wb.xlsx.writeBuffer();
  download(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fileBase(month) + ".xlsx");
  void snap;
}

export function exportBackup(snap: Snapshot) {
  download(new Blob([JSON.stringify(snap, null, 2)], { type: "application/json" }), `PD-backup-${new Date().toISOString().slice(0, 10)}.json`);
}

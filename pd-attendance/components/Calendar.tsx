import { CELL_STYLE } from "./StatusButtons";
import { daysInMonth, today, weekdayOfFirst } from "@/lib/dates";
import type { Status } from "@/lib/types";

const WD = ["S", "M", "T", "W", "T", "F", "S"];

/** Month grid. big = tappable day boxes with a letter; small = tiny coloured squares for the year view. */
export function MonthGrid({ month, statusByDay, big, onDay }: {
  month: string;
  statusByDay: Record<number, Status>;
  big?: boolean;
  onDay?: (day: number) => void;
}) {
  const blanks = weekdayOfFirst(month);
  const n = daysInMonth(month);
  const todayStr = today();
  const cells: (number | null)[] = [...Array(blanks).fill(null), ...Array.from({ length: n }, (_, i) => i + 1)];
  return (
    <div className={`grid grid-cols-7 ${big ? "gap-1.5" : "gap-0.5"}`}>
      {big && WD.map((d, i) => <div key={i} className="pb-1 text-center text-xs font-bold text-slate-400">{d}</div>)}
      {cells.map((d, i) => {
        if (d === null) return <div key={i} />;
        const s = statusByDay[d];
        const isToday = `${month}-${String(d).padStart(2, "0")}` === todayStr;
        return (
          <button
            key={i}
            disabled={!onDay}
            onClick={() => onDay?.(d)}
            className={`flex items-center justify-center rounded-lg ${big ? "h-12 flex-col leading-tight transition active:scale-95" : "aspect-square rounded-[3px] text-[0]"} ${s ? CELL_STYLE[s] : "bg-slate-100 text-slate-500"} ${isToday ? "ring-2 ring-amber-500 ring-offset-1" : ""}`}
            title={`${d}`}
          >
            {big ? (<><span className="text-[10px] font-medium opacity-80">{d}</span><span className="text-base font-extrabold">{s === "H" ? "½" : s ?? ""}</span></>) : d}
          </button>
        );
      })}
    </div>
  );
}

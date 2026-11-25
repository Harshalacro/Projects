import { CELL_STYLE } from "./StatusButtons";
import { daysInMonth, weekdayOfFirst } from "@/lib/dates";
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
  const cells: (number | null)[] = [...Array(blanks).fill(null), ...Array.from({ length: n }, (_, i) => i + 1)];
  return (
    <div className="grid grid-cols-7 gap-1">
      {big && WD.map((d, i) => <div key={i} className="text-center text-xs font-semibold text-slate-500">{d}</div>)}
      {cells.map((d, i) =>
        d === null ? <div key={i} /> : (
          <button
            key={i}
            disabled={!onDay}
            onClick={() => onDay?.(d)}
            className={`flex items-center justify-center rounded ${big ? "h-11 flex-col text-xs leading-tight" : "aspect-square text-[0]"} ${statusByDay[d] ? CELL_STYLE[statusByDay[d]] : "bg-slate-100 text-slate-500"}`}
            title={`${d}`}
          >
            {big ? (<><span className="text-[10px] opacity-80">{d}</span><span className="text-base font-extrabold">{statusByDay[d] === "H" ? "½" : statusByDay[d] ?? ""}</span></>) : d}
          </button>
        ),
      )}
    </div>
  );
}

import type { Status } from "@/lib/types";

export const STATUS_STYLE: Record<Status, { on: string; off: string; label: string; name: string }> = {
  P: { on: "bg-green-600 text-white ring-green-600", off: "bg-green-50 text-green-700 ring-green-200 hover:bg-green-100", label: "P", name: "Present" },
  A: { on: "bg-red-600 text-white ring-red-600", off: "bg-red-50 text-red-700 ring-red-200 hover:bg-red-100", label: "A", name: "Absent" },
  H: { on: "bg-orange-500 text-white ring-orange-500", off: "bg-orange-50 text-orange-700 ring-orange-200 hover:bg-orange-100", label: "½", name: "Half day" },
};
export const CELL_STYLE: Record<Status, string> = {
  P: "bg-green-600 text-white",
  A: "bg-red-600 text-white",
  H: "bg-orange-500 text-white",
};

/** Three big P / A / ½ buttons. Tapping the active one again clears it. */
export function StatusButtons({ value, onChange }: { value: Status | undefined; onChange: (s: Status | null) => void }) {
  return (
    <div className="flex gap-1.5" role="group" aria-label="Attendance">
      {(["P", "A", "H"] as Status[]).map((s) => (
        <button
          key={s}
          onClick={() => onChange(value === s ? null : s)}
          aria-label={STATUS_STYLE[s].name}
          aria-pressed={value === s}
          className={`h-12 w-12 rounded-xl text-xl font-extrabold ring-1 transition active:scale-95 ${value === s ? STATUS_STYLE[s].on + " shadow-md" : STATUS_STYLE[s].off}`}
        >
          {STATUS_STYLE[s].label}
        </button>
      ))}
    </div>
  );
}

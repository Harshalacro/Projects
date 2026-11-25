import type { Status } from "@/lib/types";

export const STATUS_STYLE: Record<Status, { on: string; off: string; label: string }> = {
  P: { on: "bg-green-600 text-white border-green-600", off: "text-green-700 border-green-300", label: "P" },
  A: { on: "bg-red-600 text-white border-red-600", off: "text-red-700 border-red-300", label: "A" },
  H: { on: "bg-orange-500 text-white border-orange-500", off: "text-orange-600 border-orange-300", label: "½" },
};
export const CELL_STYLE: Record<Status, string> = {
  P: "bg-green-600 text-white",
  A: "bg-red-600 text-white",
  H: "bg-orange-500 text-white",
};

/** Three big P / A / ½ buttons. Tapping the active one again clears it. */
export function StatusButtons({ value, onChange }: { value: Status | undefined; onChange: (s: Status | null) => void }) {
  return (
    <div className="flex gap-2">
      {(["P", "A", "H"] as Status[]).map((s) => (
        <button
          key={s}
          onClick={() => onChange(value === s ? null : s)}
          aria-label={s === "P" ? "Present" : s === "A" ? "Absent" : "Half day"}
          aria-pressed={value === s}
          className={`h-14 w-14 rounded-xl border-2 text-2xl font-extrabold ${value === s ? STATUS_STYLE[s].on : "bg-white " + STATUS_STYLE[s].off}`}
        >
          {STATUS_STYLE[s].label}
        </button>
      ))}
    </div>
  );
}

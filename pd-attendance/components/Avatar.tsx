const COLORS = ["bg-sky-100 text-sky-800", "bg-violet-100 text-violet-800", "bg-emerald-100 text-emerald-800", "bg-rose-100 text-rose-800", "bg-amber-100 text-amber-800", "bg-teal-100 text-teal-800", "bg-indigo-100 text-indigo-800"];

export function Avatar({ name, size = "h-11 w-11 text-base" }: { name: string; size?: string }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length;
  return <div className={`flex ${size} shrink-0 items-center justify-center rounded-full font-bold ${COLORS[hue]}`}>{initials}</div>;
}

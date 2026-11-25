"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useData } from "./DataProvider";
import { T } from "./T";
import type { LabelKey } from "@/lib/i18n";

const TABS: { href: string; key: LabelKey; icon: string }[] = [
  { href: "/attendance", key: "attendance", icon: "✔" },
  { href: "/workers", key: "workers", icon: "👷" },
  { href: "/summary", key: "summary", icon: "₹" },
  { href: "/sites", key: "sites", icon: "🏗" },
];

/** Login gate + header + bottom tab bar shared by all screens. */
export function Shell({ title, back, children }: { title: ReactNode; back?: string; children: ReactNode }) {
  const { ready, profile, mode, error, signOut, resetDemo } = useData();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (ready && !profile) router.replace("/login");
  }, [ready, profile, router]);

  if (!ready || !profile) return <div className="p-8 text-center text-lg text-slate-500">Loading…</div>;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-slate-50 print:max-w-none">
      <header className="sticky top-0 z-20 flex items-center gap-2 bg-amber-500 px-3 py-3 text-slate-900 shadow print:hidden">
        {back && (
          <Link href={back} className="rounded-lg bg-amber-400 px-3 py-1 text-2xl font-bold" aria-label="Back">‹</Link>
        )}
        <h1 className="flex-1 truncate text-xl font-bold">{title}</h1>
        <button onClick={signOut} className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold"><T k="logout" hi={false} /></button>
      </header>
      {mode === "demo" && (
        <div className="bg-slate-800 px-3 py-1.5 text-center text-xs text-amber-200 print:hidden">
          Demo mode – data is saved only in this browser.{" "}
          <button className="underline" onClick={() => confirm("Reset demo data?") && resetDemo()}>Reset</button>
        </div>
      )}
      {error && <div className="bg-red-600 px-3 py-2 text-center text-sm font-semibold text-white">{error}</div>}
      <main className="flex-1 px-3 pb-28 pt-3 print:p-0">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md border-t border-slate-300 bg-white print:hidden">
        {TABS.map((t) => {
          const on = path.startsWith(t.href);
          return (
            <Link key={t.href} href={t.href} className={`flex flex-1 flex-col items-center py-2 text-sm font-semibold ${on ? "bg-amber-100 text-amber-800" : "text-slate-600"}`}>
              <span className="text-xl leading-none">{t.icon}</span>
              <T k={t.key} hi={false} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

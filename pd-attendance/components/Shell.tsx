"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useData } from "./DataProvider";
import { Icon, type IconName } from "./Icon";
import { T } from "./T";
import type { LabelKey } from "@/lib/i18n";

const TABS: { href: string; key: LabelKey; icon: IconName }[] = [
  { href: "/attendance", key: "attendance", icon: "clipboard" },
  { href: "/workers", key: "workers", icon: "users" },
  { href: "/summary", key: "summary", icon: "rupee" },
  { href: "/sites", key: "sites", icon: "building" },
  { href: "/settings", key: "settings", icon: "settings" },
];

export function Logo({ size = "h-9 w-9 text-sm" }: { size?: string }) {
  return <div className={`flex ${size} shrink-0 items-center justify-center rounded-xl bg-amber-500 font-black tracking-tight text-slate-900`}>P&amp;D</div>;
}

/** Login gate + header + navigation (bottom bar on phones, side bar on larger screens). */
export function Shell({ title, back, action, children }: { title: ReactNode; back?: string; action?: ReactNode; children: ReactNode }) {
  const { ready, profile, mode, error, online, pending } = useData();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (ready && !profile) router.replace("/login");
  }, [ready, profile, router]);

  if (!ready || !profile) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Logo size="h-14 w-14 text-lg" />
          <span className="text-sm font-medium">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh md:flex">
      {/* Side bar (tablet / laptop) */}
      <aside className="hidden w-60 shrink-0 flex-col bg-slate-900 p-4 text-slate-300 md:flex print:hidden">
        <div className="mb-8 flex items-center gap-3 px-2 pt-2">
          <Logo size="h-11 w-11 text-base" />
          <div className="leading-tight">
            <div className="font-bold text-white">P&amp;D Construction</div>
            <div className="text-xs text-slate-400">Private Limited</div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {TABS.map((t) => {
            const on = path.startsWith(t.href);
            return (
              <Link key={t.href} href={t.href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold transition ${on ? "bg-amber-500 text-slate-900" : "hover:bg-slate-800 hover:text-white"}`}>
                <Icon name={t.icon} /> <T k={t.key} hi={false} />
              </Link>
            );
          })}
        </nav>
        <div className="px-2 text-xs text-slate-500">{profile.name} · {profile.role}</div>
      </aside>

      <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-1 flex-col md:max-w-none">
        <header className="sticky top-0 z-20 flex items-center gap-3 bg-slate-900 px-4 py-3 text-white shadow-md print:hidden">
          {back ? (
            <Link href={back} className="-ml-1 rounded-full bg-slate-800 p-2 hover:bg-slate-700" aria-label="Back"><Icon name="left" /></Link>
          ) : (
            <span className="md:hidden"><Logo /></span>
          )}
          <h1 className="min-w-0 flex-1 truncate text-lg font-bold">{title}</h1>
          {(!online || pending > 0) && (
            <span className="flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-slate-900">
              <Icon name={online ? "cloud" : "wifioff"} className="h-4 w-4" /> {online ? `Syncing ${pending}` : pending ? `Offline · ${pending} saved` : "Offline"}
            </span>
          )}
          {action}
        </header>

        {mode === "demo" && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-900 print:hidden">
            Demo mode — data is saved only in this browser.{" "}
            <Link href="/settings" className="underline">Settings</Link>
          </div>
        )}
        {error && <div role="alert" className="bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white print:hidden">{error}</div>}

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-4 md:pb-10 print:max-w-none print:p-0">{children}</main>
      </div>

      {/* Bottom bar (phones) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden print:hidden">
        {TABS.map((t) => {
          const on = path.startsWith(t.href);
          return (
            <Link key={t.href} href={t.href} className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${on ? "text-amber-700" : "text-slate-500"}`}>
              {on && <span className="absolute inset-x-5 top-0 h-1 rounded-b-full bg-amber-500" />}
              <Icon name={t.icon} className="h-6 w-6" strokeWidth={on ? 2.4 : 1.9} />
              <T k={t.key} hi={false} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/** Round icon button for header actions. */
export function HeaderButton({ onClick, label, icon }: { onClick: () => void; label: string; icon: IconName }) {
  return (
    <button onClick={onClick} aria-label={label} className="rounded-full bg-slate-800 p-2 hover:bg-slate-700"><Icon name={icon} /></button>
  );
}

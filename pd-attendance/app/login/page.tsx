"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/components/DataProvider";
import { Logo } from "@/components/Shell";
import { Icon } from "@/components/Icon";
import { btnPrimary, inputCls } from "@/components/Modal";
import { T } from "@/components/T";

export default function Login() {
  const { ready, profile, signIn } = useData();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && profile) router.replace("/attendance");
  }, [ready, profile, router]);

  return (
    <div className="flex min-h-dvh flex-col bg-slate-900 md:flex-row">
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-10 pt-16 text-center text-white">
        <Logo size="h-20 w-20 text-2xl" />
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight">P&amp;D Construction</h1>
        <p className="mt-1 text-slate-300">Private Limited</p>
        <p className="mt-6 hidden max-w-xs text-sm text-slate-400 md:block">Attendance, wages and site management — one simple app for the whole team.</p>
      </div>
      <div className="rounded-t-3xl bg-white px-6 pb-10 pt-8 md:flex md:w-[28rem] md:items-center md:rounded-none md:px-10">
        <form
          className="mx-auto w-full max-w-sm space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setErr(await signIn(phone, password));
            setBusy(false);
          }}
        >
          <div>
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-sm text-slate-500">Sign in with your phone number and password.</p>
          </div>
          <label className="label"><T k="phone" hi />
            <input className={inputCls} inputMode="tel" autoComplete="username" placeholder="98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="label"><T k="password" />
            <input className={inputCls} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {err && <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-200"><Icon name="alert" className="h-5 w-5 shrink-0" /> {err}</p>}
          <button className={btnPrimary} disabled={busy || !phone || !password}>{busy ? "Signing in…" : <T k="login" />}</button>
        </form>
      </div>
    </div>
  );
}

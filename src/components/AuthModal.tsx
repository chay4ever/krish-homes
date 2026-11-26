import { useState } from "react";
import { Mail, Phone, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button, Field, Input, Sheet } from "./ui";
import { LogoMark } from "./Brand";
import { useApp } from "@/lib/app";
import { confirmPhoneOtp, friendlyAuthError, resetPassword, sendPhoneOtp, signInEmail, signInGoogle, signUpEmail } from "@/lib/firebase";
import { cx } from "@/lib/format";
import { api } from "@/lib/api";

/** Built-in email + password sign-in, used until Firebase is configured by the Super Admin. */
function LocalAuth({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  return (
    <form className="mt-4 space-y-3" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setErr(null); try { await api.post(mode === "signup" ? "/api/auth/register" : "/api/auth/login", f); onDone(); } catch (x: any) { setErr(x.message); } finally { setBusy(false); } }}>
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/5 p-1">{(["signin", "signup"] as const).map((m) => <button type="button" key={m} onClick={() => { setMode(m); setErr(null); }} className={cx("rounded-xl py-2.5 text-sm font-bold transition", mode === m ? "bg-white shadow-card" : "text-ink-3")}>{m === "signin" ? "Sign in" : "Create account"}</button>)}</div>
      {mode === "signup" && <Field label="Full name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" required /></Field>}
      <Field label="Email"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" required /></Field>
      {mode === "signup" && <Field label="Mobile (optional)"><Input type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} autoComplete="tel" placeholder="+91 98765 43210" /></Field>}
      <Field label="Password" hint={mode === "signup" ? "At least 8 characters" : undefined}><Input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={mode === "signup" ? 8 : undefined} required /></Field>
      {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
      <Button type="submit" size="lg" full loading={busy}>{mode === "signup" ? "Create account" : "Sign in"}</Button>
    </form>
  );
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3A12 12 0 1 1 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7A20 20 0 1 0 44 24c0-1.3-.1-2.700-.4-3.900z" /><path fill="#FF3D00" d="m6.3 14.700 6.600 4.800A12 12 0 0 1 24 12c3.100 0 5.800 1.200 8 3l5.700-5.700A20 20 0 0 0 6.300 14.700z" /><path fill="#4CAF50" d="M24 44c5.200 0 9.900-2 13.400-5.200l-6.200-5.200A12 12 0 0 1 12.700 28l-6.500 5A20 20 0 0 0 24 44z" /><path fill="#1976D2" d="M43.600 20.100H42V20H24v8h11.300a12 12 0 0 1-4.100 5.600l6.200 5.200C37 39.200 44 34 44 24c0-1.300-.1-2.700-.4-3.900z" /></svg>
);

export default function AuthModal({ open, onClose, onDone, reason }: { open: boolean; onClose: () => void; onDone: () => void; reason: string }) {
  const { brand, firebaseEnabled } = useApp();
  const [tab, setTab] = useState<"phone" | "email">("phone");
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [phone, setPhone] = useState("+91 ");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const run = async (fn: () => Promise<void>, done = true) => {
    setBusy(true); setErr(null); setInfo(null);
    try { await fn(); if (done) onDone(); } catch (e) { setErr(friendlyAuthError(e)); } finally { setBusy(false); }
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="pb-2 text-center">
        <LogoMark size={52} className="mx-auto" />
        <h2 className="mt-4 font-display text-2xl font-semibold">Welcome to {brand.name}</h2>
        <p className="mx-auto mt-1 max-w-xs text-sm text-ink-3">{reason || "Sign in to save homes, contact owners and post your property."}</p>
      </div>

      {!firebaseEnabled ? (
        <LocalAuth onDone={onDone} />
      ) : (
        <div className="mt-4 space-y-3">
          <Button variant="outline" size="lg" full onClick={() => run(signInGoogle)} disabled={busy}><GoogleIcon /> Continue with Google</Button>
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-ink-3"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/5 p-1">
            {([["phone", "Phone OTP", Phone], ["email", "Email", Mail]] as const).map(([k, l, I]) => (
              <button key={k} onClick={() => { setTab(k); setErr(null); }} className={cx("flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition", tab === k ? "bg-white shadow-card" : "text-ink-3")}><I size={16} />{l}</button>
            ))}
          </div>

          {tab === "phone" ? (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); otpSent ? run(() => confirmPhoneOtp(otp)) : run(async () => { await sendPhoneOtp(phone.replace(/\s/g, ""), "recaptcha-box"); setOtpSent(true); setInfo("We've sent a 6-digit code by SMS."); }, false); }}>
              {!otpSent ? (
                <Field label="Mobile number"><Input inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" /></Field>
              ) : (
                <Field label="Enter OTP" hint={`Sent to ${phone}`}>
                  <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="••••••" className="text-center text-xl tracking-[0.5em]" autoFocus />
                </Field>
              )}
              <Button type="submit" size="lg" full loading={busy}>{otpSent ? "Verify & continue" : "Send OTP"}</Button>
              {otpSent && <button type="button" className="mx-auto flex items-center gap-1 text-sm font-semibold text-brand-700" onClick={() => { setOtpSent(false); setOtp(""); }}><ArrowLeft size={14} /> Change number</button>}
              <div id="recaptcha-box" />
            </form>
          ) : (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault();
              if (mode === "reset") return run(async () => { await resetPassword(email); setInfo("Password reset link sent. Check your inbox."); setMode("signin"); }, false);
              run(() => (mode === "signup" ? signUpEmail(name, email, password) : signInEmail(email, password))); }}>
              {mode === "signup" && <Field label="Full name"><Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Your name" required /></Field>}
              <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" required /></Field>
              {mode !== "reset" && <Field label="Password"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={6} placeholder="At least 6 characters" required /></Field>}
              <Button type="submit" size="lg" full loading={busy}>{mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}</Button>
              <div className="flex justify-between text-sm font-semibold text-brand-700">
                <button type="button" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>{mode === "signup" ? "Have an account? Sign in" : "New here? Create account"}</button>
                {mode === "signin" && <button type="button" onClick={() => setMode("reset")}>Forgot password?</button>}
              </div>
            </form>
          )}
          {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
          {info && <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-medium text-brand-800">{info}</p>}
        </div>
      )}
      <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-ink-3"><ShieldCheck size={14} /> Your details are safe and never shared without consent.</p>
    </Sheet>
  );
}

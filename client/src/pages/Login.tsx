import { ArrowLeft, ArrowUpRight, Code2, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import CodeOrbit from "@/components/CodeOrbit";
import HandThrowing from "@/assets/Hand-Throwing.png";
import MoneyWeight from "@/assets/Money-Weight.png";

export default function Login() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const login = trpc.auth.login.useMutation({ onSuccess: async user => { utils.auth.me.setData(undefined, user); toast.success("Welcome back"); navigate("/"); }, onError: error => toast.error(error.message) });
  const register = trpc.auth.register.useMutation({ onSuccess: async user => { utils.auth.me.setData(undefined, user); toast.success("Your DevMarket account is ready"); navigate("/"); }, onError: error => toast.error(error.message) });
  const pending = login.isPending || register.isPending;
  function submit(event: React.FormEvent) { event.preventDefault(); if (mode === "login") login.mutate({ email: form.email, password: form.password }); else register.mutate(form); }

  return (
    <div className="liquid-page min-h-screen bg-[#eef8fa] text-[#172039]">
      <main className="grid min-h-screen lg:h-screen overflow-hidden lg:grid-cols-[.82fr_1.18fr]">
        {/* LEFT — BRAND + CODE ORBIT */}
        <section className="relative flex min-h-[520px] flex-col justify-between overflow-hidden bg-[#172039] px-7 py-6 text-white sm:px-12 lg:min-h-0 lg:h-screen lg:px-16 lg:py-8">
          {/* Atmosphere */}
          <div className="absolute -right-20 -top-16 h-64 w-64 rounded-full bg-[#13b8b0] opacity-30 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-[#c7f76d] opacity-15 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(19,184,176,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(19,184,176,.3) 1px, transparent 1px)", backgroundSize: "42px 42px" }} />

          {/* Decorative images */}
          <img src={HandThrowing} alt="" className="absolute top-0 right-0 w-[14rem] sm:w-[16rem] pointer-events-none select-none opacity-80 -scale-x-100 rotate-12" />
          <img src={MoneyWeight} alt="" className="absolute bottom-1 left-1 w-32 sm:w-40 pointer-events-none select-none opacity-80" />

          <Link href="/" className="relative z-10 inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white fade-up">
            <ArrowLeft size={16} /> Back to DevMarket
          </Link>

          <div className="relative z-10 max-w-xl py-6 lg:py-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c7f76d] text-[#172039] fade-up" style={{ animationDelay: "80ms" }}>
              <Code2 size={24} />
            </div>
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[.2em] text-[#13b8b0] fade-up" style={{ animationDelay: "160ms" }}>Private builder access</p>
            <h1 className="mt-3 max-w-lg font-display text-4xl font-semibold leading-[.9] tracking-[-.08em] sm:text-6xl fade-up" style={{ animationDelay: "240ms" }}>Build your next unfair advantage.</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/65 fade-up" style={{ animationDelay: "320ms" }}>Sign in to access purchased source code, track manual payments, and leave verified reviews.</p>

            <div className="mt-6 fade-up ml-24" style={{ animationDelay: "480ms" }}>
              <CodeOrbit />
            </div>
          </div>

          <p className="relative z-10 font-mono text-[10px] uppercase tracking-[.16em] text-white/40 fade-up" style={{ animationDelay: "560ms" }}>
            Email & password only · Secure session · BUILD / SHIP / SCALE
          </p>
        </section>

        {/* RIGHT — AUTH PANEL */}
        <section className="flex items-center px-6 py-12 sm:px-12 lg:px-20 xl:px-28">
          <div className="mx-auto w-full max-w-xl fade-up" style={{ animationDelay: "400ms" }}>
            <div className="auth-switch">
              <span className={`auth-switch-indicator ${mode === "register" ? "is-register" : ""}`} aria-hidden="true" />
              <button type="button" onClick={() => setMode("login")} className={mode === "login" ? "is-active" : ""}>Sign in</button>
              <button type="button" onClick={() => setMode("register")} className={mode === "register" ? "is-active" : ""}>Create account</button>
            </div>

            <div key={mode} className="auth-mode-swap mt-8">
              <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#13b8b0]">Email & password only</p>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-.08em] sm:text-5xl">{mode === "login" ? "Welcome back." : "Start building."}</h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-[#53617d]">{mode === "login" ? "Use your DevMarket credentials to continue." : "Create a secure account in less than a minute."}</p>

              <form onSubmit={submit} className="mt-8 space-y-4">
                {mode === "register" && (
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-[#53617d]">Name</span>
                    <span className="relative block">
                      <UserRound className="absolute left-3 top-3.5 text-[#71809f] transition peer-focus:text-[#13b8b0]" size={17} />
                      <input required minLength={2} maxLength={160} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className="w-full rounded-xl border border-[#d7e8eb] bg-[#eef8fa] py-3 pl-10 pr-4 text-xs outline-none transition focus:border-[#13b8b0] focus:ring-4 focus:ring-[#13b8b0]/10" placeholder="Your name" />
                    </span>
                  </label>
                )}
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-[#53617d]">Email address</span>
                  <span className="relative block">
                    <Mail className="absolute left-3 top-3.5 text-[#71809f]" size={17} />
                    <input required type="email" maxLength={320} value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} className="w-full rounded-xl border border-[#d7e8eb] bg-[#eef8fa] py-3 pl-10 pr-4 text-xs outline-none transition focus:border-[#13b8b0] focus:ring-4 focus:ring-[#13b8b0]/10" placeholder="you@example.com" />
                  </span>
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-[#53617d]">Password</span>
                  <span className="relative block">
                    <LockKeyhole className="absolute left-3 top-3.5 text-[#71809f]" size={17} />
                    <input required minLength={8} maxLength={128} type={showPassword ? "text" : "password"} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} className="w-full rounded-xl border border-[#d7e8eb] bg-[#eef8fa] py-3 pl-10 pr-12 text-xs outline-none transition focus:border-[#13b8b0] focus:ring-4 focus:ring-[#13b8b0]/10" placeholder="At least 8 characters" />
                    <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-3 text-[#71809f] transition hover:text-[#13b8b0]">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                  </span>
                </label>
                <button type="submit" disabled={pending} className="sweep-button w-full py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50">
                  {pending ? "Working…" : mode === "login" ? "Sign in securely" : "Create my account"}
                  <ArrowUpRight size={17} />
                </button>
              </form>
              <p className="mt-5 text-center text-[10px] leading-5 text-[#71809f]">By continuing, you agree to use DevMarket for legitimate digital products and verified transactions.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

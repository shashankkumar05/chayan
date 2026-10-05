import { useState } from "react";
import { call } from "./api.js";
import { Wordmark, Footer } from "./Brand.jsx";

const qs = new URLSearchParams(window.location.search);
const resetUid = qs.get("uid"), resetToken = qs.get("token");

const FEATURES = [
  ["📊", "ATS Resume Analysis", "Get an accurate ATS score for your resume"],
  ["🎯", "Job Description Matching", "See how well your skills match the job"],
  ["🔎", "Missing Keyword Detection", "Find important skills and keywords you're missing"],
  ["💡", "Improvement Suggestions", "Get personalized tips to make your resume stronger"],
];
const TITLES = {
  login: ["Welcome back 👋", "Sign in to continue your career journey."],
  register: ["Create your account 🚀", "Start analyzing your resume in under a minute."],
  forgot: ["Forgot password? 🔑", "Enter your email and we'll send you a reset link."],
  reset: ["Set a new password 🔒", "Choose a strong password you haven't used before."],
};
const BTN = { login: "Login", register: "Create account", forgot: "Send reset link", reset: "Update password" };

const Field = ({ icon, right, ...p }) => (
  <div className="relative mb-3">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
    <input {...p} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-11 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
    {right}
  </div>
);

function Illustration() {
  const bar = "h-1.5 rounded bg-slate-200";
  const chips = (list, c) => list.map((s) => <span key={s} className={`text-[10px] px-2 py-0.5 rounded-full ${c}`}>{s}</span>);
  const rows = [["Job Match", 72, "72%", "from-indigo-500 to-purple-500"], ["Skills Match", 68, "68%", "from-pink-500 to-fuchsia-500"], ["Missing Skills", 25, "5", "from-amber-400 to-orange-400"]];
  return (
    <div className="relative hidden xl:block h-[430px]">
      <div className="absolute left-0 top-4 w-48 -rotate-6 rounded-2xl bg-white/95 p-4 shadow-2xl">
        <div className="text-xs font-semibold text-slate-700 mb-2">📄 Your Resume</div>
        <div className={`${bar} w-full mb-1.5`} /><div className={`${bar} w-4/5 mb-3`} />
        <div className="flex flex-wrap gap-1">{chips(["Python", "Django", "React", "SQL"], "bg-emerald-100 text-emerald-700")}</div>
      </div>
      <div className="absolute right-0 top-16 w-48 rotate-6 rounded-2xl bg-white/95 p-4 shadow-2xl">
        <div className="text-xs font-semibold text-slate-700 mb-2">💼 Job Description</div>
        <div className="flex flex-wrap gap-1">{chips(["Python", "AWS", "Docker", "PostgreSQL", "React"], "bg-purple-100 text-purple-700")}</div>
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-56 rounded-2xl bg-white p-4 shadow-2xl">
        <svg width="84" height="84" viewBox="0 0 84 84" className="mx-auto">
          <defs><linearGradient id="demoRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#10b981" /><stop offset="1" stopColor="#6366f1" /></linearGradient></defs>
          <circle cx="42" cy="42" r="34" fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle cx="42" cy="42" r="34" fill="none" stroke="url(#demoRing)" strokeWidth="8" strokeLinecap="round" strokeDasharray="213.6" strokeDashoffset="40.6" transform="rotate(-90 42 42)" />
          <text x="42" y="48" textAnchor="middle" fill="#0f172a" style={{ fontSize: 20, fontWeight: 800 }}>81%</text>
        </svg>
        <div className="text-center text-[11px] text-slate-500 mb-2">ATS Score (sample)</div>
        {rows.map(([l, w, v, g]) => (
          <div key={l} className="mb-1.5">
            <div className="flex justify-between text-[10px] text-slate-600"><span>{l}</span><span className="font-semibold">{v}</span></div>
            <div className="h-1.5 rounded-full bg-slate-100"><div className={`h-full rounded-full bg-gradient-to-r ${g}`} style={{ width: w + "%" }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Auth({ onToken }) {
  const [mode, setMode] = useState(resetUid && resetToken ? "reset" : "login");
  const [f, setF] = useState({ ident: "", name: "", username: "", email: "", password: "" });
  const [remember, setRemember] = useState(false);
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const go = (m) => { setMode(m); setErr(""); setMsg(""); };
  const json = (body) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

  const login = async (username, password, keep) => {
    const t = await call("/auth/login", json({ username, password, remember: keep }));
    localStorage.removeItem("token"); sessionStorage.removeItem("token");
    (keep ? localStorage : sessionStorage).setItem("token", t.access);
    onToken(t.access);
  };
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr(""); setMsg("");
    try {
      if (mode === "login") await login(f.ident.trim(), f.password, remember);
      else if (mode === "register") {
        await call("/auth/register", json({ name: f.name, username: f.username, email: f.email, password: f.password }));
        await login(f.username, f.password, true);
      } else if (mode === "forgot") {
        const d = await call("/auth/forgot-password", json({ email: f.email }));
        setMsg(d.detail);
      } else {
        const d = await call("/auth/reset-password", json({ uid: resetUid, token: resetToken, password: f.password }));
        window.history.replaceState({}, "", window.location.pathname);
        setMode("login"); setF({ ...f, password: "" }); setMsg(d.detail);
      }
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };

  const eye = (
    <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{show ? "🙈" : "👁️"}</button>
  );
  const pw = <Field icon="🔒" type={show ? "text" : "password"} placeholder={mode === "reset" ? "New password (min 8 characters)" : "Password (min 8 characters)"} value={f.password} onChange={set("password")} right={eye} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "login" ? undefined : 8} />;
  const [title, sub] = TITLES[mode];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="max-w-7xl mx-auto w-full px-5 py-5 flex items-center justify-between">
        <Wordmark />
        {mode !== "reset" && (
          <button onClick={() => go(mode === "register" ? "login" : "register")} className="rounded-full border border-fuchsia-400/60 text-white px-5 py-2 text-sm font-semibold hover:bg-white/10 transition">
            {mode === "register" ? "Login" : "Create Account"}
          </button>
        )}
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-5 py-6 grid gap-8 lg:grid-cols-2 xl:grid-cols-[1.1fr_0.9fr_0.9fr] items-center">
        <section>
          <span className="inline-block rounded-full bg-white/10 ring-1 ring-white/20 px-4 py-1.5 text-xs font-medium text-indigo-100">✨ AI-Powered Resume Analyzer</span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-white leading-tight">
            Your resume deserves a <span className="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">better chance.</span>
          </h1>
          <p className="mt-4 text-indigo-100 max-w-lg">Chayan compares your resume with the job description to show your ATS score, job match, missing skills, and areas to improve.</p>
          <p className="mt-2 text-sm italic text-indigo-300">See your resume the way ATS sees it.</p>
          <div className="mt-8 hidden md:grid gap-4">
            {FEATURES.map(([icon, t, s]) => (
              <div key={t} className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/10 ring-1 ring-white/10 grid place-items-center text-xl">{icon}</div>
                <div><div className="text-sm font-semibold text-white">{t}</div><div className="text-xs text-indigo-200">{s}</div></div>
              </div>
            ))}
          </div>
        </section>
        <Illustration />
        <section className="order-first lg:order-none flex justify-center">
          <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl shadow-indigo-950/50">
            <Wordmark dark size={40} />
            <h2 className="mt-6 text-2xl font-extrabold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500 mb-5">{sub}</p>
            {mode === "register" && <Field icon="🙂" placeholder="Full name" value={f.name} onChange={set("name")} autoComplete="name" required />}
            {mode === "register" && <Field icon="👤" placeholder="Username" value={f.username} onChange={set("username")} autoComplete="username" required />}
            {mode === "login" && <Field icon="✉️" placeholder="Email or Username" value={f.ident} onChange={set("ident")} autoComplete="username" required />}
            {(mode === "register" || mode === "forgot") && <Field icon="✉️" type="email" placeholder="Email address" value={f.email} onChange={set("email")} autoComplete="email" required />}
            {mode !== "forgot" && pw}
            {mode === "login" && (
              <div className="flex items-center justify-between text-sm mb-4">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-indigo-600" /> Remember me</label>
                <button type="button" onClick={() => go("forgot")} className="font-medium text-indigo-600 hover:underline">Forgot password?</button>
              </div>
            )}
            {mode === "register" && <p className="text-xs text-slate-500 mb-3">By signing up you agree that we store your name, email and analysis history. Your password is stored encrypted.</p>}
            {err && <div className="mb-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-3">⚠️ {err}</div>}
            {msg && <div className="mb-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-3">✅ {msg}</div>}
            <button disabled={busy} className="w-full rounded-xl py-3 font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 shadow-lg shadow-purple-500/30 hover:scale-[1.01] active:scale-95 transition disabled:opacity-60">
              {busy ? "Please wait..." : BTN[mode]}
            </button>
            <p className="mt-5 text-center text-sm text-slate-600">
              {mode === "login" && <>Don't have an account? <button type="button" onClick={() => go("register")} className="font-semibold text-indigo-600 hover:underline">Create account</button></>}
              {mode === "register" && <>Already have an account? <button type="button" onClick={() => go("login")} className="font-semibold text-indigo-600 hover:underline">Login</button></>}
              {(mode === "forgot" || mode === "reset") && <button type="button" onClick={() => go("login")} className="font-semibold text-indigo-600 hover:underline">← Back to login</button>}
            </p>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}

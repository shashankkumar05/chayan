import { useEffect, useRef, useState } from "react";
import { call } from "./api.js";
import Auth from "./Auth.jsx";
import { Footer, Wordmark } from "./Brand.jsx";
import { AnalyzeCard, BreakdownCard, Glass, HistoryRows, HistorySection, KeywordsCard, ResultCard, SkillsCard, SuggestionsCard, matches } from "./Dashboard.jsx";
import { downloadReport } from "./report.js";
import { fmt } from "./utils.js";

const NAV = [["dashboard", "🏠", "Dashboard"], ["history", "🕘", "Analysis History"], ["profile", "👤", "Profile"]];

function Sidebar({ page, setPage, open, setOpen }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed top-0 left-0 z-40 h-full w-60 bg-slate-950/80 backdrop-blur border-r border-white/10 p-5 transition-transform ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <Wordmark size={40} />
        <nav className="mt-8 space-y-2">
          {NAV.map(([k, icon, label]) => (
            <button key={k} onClick={() => { setPage(k); setOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${page === k ? "bg-gradient-to-r from-indigo-600 to-pink-500 text-white shadow-lg" : "text-indigo-100 hover:bg-white/10"}`}><span>{icon}</span>{label}</button>
          ))}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
          <div className="text-2xl mb-1">📄</div>
          <div className="text-sm font-semibold text-white">Make your resume job-ready</div>
          <div className="text-xs text-indigo-200 mt-1">Get detailed insights, missing skills and personalized suggestions.</div>
        </div>
      </aside>
    </>
  );
}

function Topbar({ user, query, setQuery, onMenu, setPage, onLogout }) {
  const [menu, setMenu] = useState(false);
  return (
    <div className="flex items-center gap-3 mb-5">
      <button onClick={onMenu} className="lg:hidden text-white text-2xl px-1" aria-label="Menu">☰</button>
      <div className="relative flex-1 max-w-md">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm">🔍</span>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search analyses..." className="w-full rounded-full bg-white/10 ring-1 ring-white/15 text-sm text-white placeholder-indigo-200 pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-fuchsia-400" />
      </div>
      <div className="relative ml-auto">
        <button onClick={() => setMenu(!menu)} className="flex items-center gap-3 rounded-full bg-white/10 ring-1 ring-white/15 pl-1.5 pr-4 py-1.5 text-left">
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 grid place-items-center text-white font-bold">{(user?.name || "?")[0].toUpperCase()}</span>
          <span className="hidden sm:block leading-tight"><span className="block text-sm font-semibold text-white">{user?.name}</span><span className="block text-[11px] text-indigo-200">{user?.email}</span></span>
          <span className="text-indigo-200 text-xs">▾</span>
        </button>
        {menu && (
          <div className="absolute right-0 mt-2 w-44 rounded-xl bg-white shadow-xl py-1 text-sm z-50">
            <button onClick={() => { setPage("profile"); setMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-100 text-slate-700">👤 Profile</button>
            <button onClick={onLogout} className="w-full text-left px-4 py-2 hover:bg-slate-100 text-red-600">🚪 Logout</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || sessionStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [file, setFile] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [jd, setJd] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const resRef = useRef(null);

  const logout = () => { localStorage.removeItem("token"); sessionStorage.removeItem("token"); setToken(null); setUser(null); setResult(null); setPage("dashboard"); };
  const load = () => call("/analyses", {}, token).then(setHistory).catch(logout);
  useEffect(() => {
    if (token) { load(); call("/auth/me", {}, token).then(setUser).catch(() => {}); }
  }, [token]);
  if (!token) return <Auth onToken={setToken} />;

  const toResult = () => setTimeout(() => resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  const reset = () => { setFile(null); setJd(""); setResult(null); setErr(""); setNote(""); setFileKey((k) => k + 1); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const again = () => {
    if (result?.jd_text) setJd(result.jd_text);
    setFile(null); setFileKey((k) => k + 1); setErr("");
    setNote("Upload your updated resume and click Analyze to see how your score changes.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const open = (h) => { setResult(h); setNote(""); setPage("dashboard"); setMenuOpen(false); toResult(); };
  const analyze = async () => {
    setBusy(true); setErr(""); setNote("");
    try {
      const fd = new FormData(); fd.append("resume", file); fd.append("jd_text", jd);
      const data = await call("/analyze", { method: "POST", body: fd }, token);
      setResult(data);
      if (data.duplicate) setNote(`You've already analyzed this resume with this job description on ${fmt(data.created_at)}. Showing your earlier result. Update your resume or change the job description to get a new score.`);
      else load();
      toResult();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this analysis?")) return;
    try { await call(`/analyses/${id}`, { method: "DELETE" }, token); if (result?.id === id) setResult(null); load(); } catch (e) { setErr(e.message); }
  };

  const best = (k) => (history.length ? Math.round(Math.max(...history.map((h) => h[k]))) : 0);
  return (
    <div className="min-h-screen">
      <Sidebar page={page} setPage={setPage} open={menuOpen} setOpen={setMenuOpen} />
      <div className="lg:pl-60">
        <div className="max-w-[1400px] mx-auto p-4 sm:p-6">
          <Topbar user={user} query={query} setQuery={setQuery} onMenu={() => setMenuOpen(true)} setPage={setPage} onLogout={logout} />

          {page === "dashboard" && (
            <>
              <AnalyzeCard file={file} setFile={setFile} fileKey={fileKey} jd={jd} setJd={setJd} busy={busy} err={err} note={note} onAnalyze={analyze} onReset={reset} clearNote={() => setNote("")} />
              {result ? (
                <div ref={resRef} className="grid gap-5 mb-5 scroll-mt-4 xl:grid-cols-[5fr_3.5fr_3.5fr]">
                  <ResultCard r={result} onAgain={again} onDownload={() => downloadReport(result, user)} onNew={reset} />
                  <div className="space-y-5"><BreakdownCard r={result} /><KeywordsCard r={result} /></div>
                  <div className="space-y-5"><SkillsCard r={result} /><SuggestionsCard r={result} /></div>
                </div>
              ) : (
                <Glass icon="✨" title="Your results will appear here" className="mb-5">
                  <p className="text-sm text-indigo-200">Run your first analysis to see your ATS score, job match, missing skills and personalized suggestions.</p>
                </Glass>
              )}
              <HistorySection history={history} query={query} onOpen={open} onDelete={remove} onViewAll={() => setPage("history")} />
            </>
          )}

          {page === "history" && (
            <Glass icon="🕘" title="Analysis History">
              <HistoryRows list={matches(history, query)} onOpen={open} onDelete={remove} empty={query ? "No analyses match your search." : "No analyses yet. Run your first one from the Dashboard."} />
            </Glass>
          )}

          {page === "profile" && (
            <Glass icon="👤" title="Profile" className="max-w-xl">
              <div className="flex items-center gap-4 mb-5">
                <span className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 grid place-items-center text-2xl font-bold">{(user?.name || "?")[0].toUpperCase()}</span>
                <div><div className="text-lg font-bold">{user?.name}</div><div className="text-sm text-indigo-200">@{user?.username}</div><div className="text-sm text-indigo-200">{user?.email}</div></div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[["Analyses", history.length], ["Best match", best("match_score") + "%"], ["Best ATS", best("ats_score") + "%"]].map(([l, v]) => <div key={l} className="rounded-2xl bg-white/10 p-3 text-center"><div className="text-xl font-extrabold">{v}</div><div className="text-[11px] text-indigo-200">{l}</div></div>)}
              </div>
              {user?.joined && <p className="text-sm text-indigo-200 mb-4">Member since {fmt(user.joined)}</p>}
              <button onClick={logout} className="px-5 py-2.5 rounded-xl bg-red-500/20 text-red-200 ring-1 ring-red-400/30 hover:bg-red-500/30 text-sm font-semibold">🚪 Logout</button>
            </Glass>
          )}
          <Footer />
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";
import { LABELS, MAXES, PRIORITY, banner, fmt, grade, impLabel, normSuggestions, overall, summaryText, tone, verdict } from "./utils.js";

export const Glass = ({ icon, title, children, className = "" }) => (
  <div className={`rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur p-4 sm:p-5 text-white ${className}`}>
    <h3 className="flex items-center gap-2 font-bold mb-3"><span>{icon}</span>{title}</h3>
    {children}
  </div>
);

const Chip = ({ children, cls }) => <span className={`text-xs font-medium px-3 py-1 rounded-full ${cls}`}>{children}</span>;

/* ---------- Analyze card ---------- */
export function AnalyzeCard({ file, setFile, fileKey, jd, setJd, busy, err, note, onAnalyze, onReset, clearNote }) {
  const [drag, setDrag] = useState(false);
  const pick = (f) => { if (f) { setFile(f); clearNote(); } };
  return (
    <div className="rounded-3xl bg-white/95 backdrop-blur shadow-2xl shadow-indigo-950/40 ring-1 ring-white/40 p-4 sm:p-6 mb-5">
      <h2 className="text-xl font-extrabold text-slate-800">🔍 Analyze your resume</h2>
      <p className="text-sm text-slate-500 mb-4">Upload your resume and paste the job description to see how well you match.</p>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
            className={`block cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition ${drag ? "border-fuchsia-500 bg-fuchsia-50" : "border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50"}`}
          >
            <input key={fileKey} type="file" accept=".pdf" className="hidden" onChange={(e) => pick(e.target.files[0])} />
            <div className="text-4xl mb-1">☁️</div>
            <div className="font-semibold text-slate-700 text-sm">Drag & drop your resume here, or click to browse</div>
            <div className="text-xs text-slate-500 mt-1">PDF only · text-based · max 5 MB</div>
          </label>
          {file && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-3">
              <span className="text-2xl">📄</span>
              <div className="min-w-0 flex-1"><div className="font-semibold text-slate-800 text-sm truncate">{file.name}</div><div className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</div></div>
              <span className="text-xl">✅</span>
            </div>
          )}
        </div>
        <div>
          <div className="flex justify-between items-end mb-1"><span className="text-sm font-semibold text-slate-700">📋 Job description</span><span className="text-xs text-slate-400">{jd.length} chars</span></div>
          <textarea className="border border-slate-200 rounded-xl w-full p-3 h-44 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Paste the full job description here..." value={jd} onChange={(e) => { setJd(e.target.value); clearNote(); }} />
        </div>
      </div>
      {err && <div className="mt-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-3">⚠️ {err}</div>}
      {note && <div className="mt-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-sm p-3">⚠️ {note}</div>}
      <div className="flex items-center gap-3 mt-4">
        <button disabled={!file || !jd.trim() || busy} onClick={onAnalyze} className="px-6 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 shadow-lg shadow-purple-500/30 hover:scale-[1.02] active:scale-95 transition disabled:opacity-50 disabled:hover:scale-100">{busy ? "⏳ Analyzing..." : "✨ Analyze"}</button>
        <button onClick={onReset} className="px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium transition">↺ New analysis</button>
      </div>
    </div>
  );
}

/* ---------- Result card ---------- */
const ringColors = (v) => (v >= 70 ? ["#10b981", "#34d399"] : v >= 40 ? ["#f59e0b", "#fbbf24"] : ["#ef4444", "#f97316"]);

function Ring({ value, label, id }) {
  const r = 52, c = 2 * Math.PI * r, off = c * (1 - Math.min(Math.max(value, 0), 100) / 100);
  const [from, to] = ringColors(value);
  return (
    <div className="flex flex-col items-center">
      <svg width="130" height="130" viewBox="0 0 140 140">
        <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={from} /><stop offset="100%" stopColor={to} /></linearGradient></defs>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth="12" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={`url(#${id})`} strokeWidth="12" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 70 70)" />
        <text x="70" y="78" textAnchor="middle" fill="#0f172a" style={{ fontSize: 30, fontWeight: 800 }}>{Math.round(value)}%</text>
      </svg>
      <div className="mt-1 text-sm font-semibold text-slate-700">{label}</div>
    </div>
  );
}

function Confetti() {
  const bits = Array.from({ length: 28 }, (_, i) => ({ left: (i * 37) % 100, delay: (i % 7) * 0.15, e: ["🎉", "✨", "🎊", "⭐"][i % 4] }));
  return <div className="pointer-events-none absolute inset-0 overflow-hidden">{bits.map((b, i) => <span key={i} className="confetti" style={{ left: b.left + "%", animationDelay: b.delay + "s" }}>{b.e}</span>)}</div>;
}

export function ResultCard({ r, onAgain, onDownload, onNew }) {
  const ov = overall(r), [ic, t, m, g] = banner(ov);
  const matched = r.matched_keywords || [];
  const older = matched.length === 0 && (r.ats_breakdown?.keywords || 0) > 0; // saved before matched skills were tracked
  const tiles = [
    ["🎯", older ? "—" : matched.length, "Skills Matched", "bg-indigo-50 text-indigo-700"],
    ["⚠️", r.missing_keywords.length, "Skills Missing", "bg-pink-50 text-pink-700"],
    ["📄", `${Math.round(r.ats_breakdown?.keywords || 0)}/50`, "Keywords Found", "bg-violet-50 text-violet-700"],
    ["✅", grade(r.ats_score), "Resume Strength", "bg-emerald-50 text-emerald-700"],
  ];
  return (
    <div className="relative rounded-3xl bg-white/95 shadow-2xl shadow-indigo-950/40 ring-1 ring-white/40 overflow-hidden">
      {ov >= 60 && <Confetti key={r.id} />}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 text-white px-5 py-4 flex justify-between items-center gap-3">
        <div className="min-w-0">
          <div className="text-xs text-indigo-200">Analysis result</div>
          <div className="font-semibold truncate">📄 {r.resume_name || "Resume"}</div>
          <div className="text-[11px] text-indigo-300">{fmt(r.created_at)}</div>
        </div>
        <span className="text-xs bg-white/15 px-3 py-1 rounded-full whitespace-nowrap">{verdict(ov)}</span>
      </div>
      <div className="p-4 sm:p-5">
        <div className={`rounded-2xl bg-gradient-to-r ${g} text-white p-4 flex items-center gap-3 shadow-lg`}>
          <div className="text-3xl">{ic}</div>
          <div><div className="font-bold text-lg leading-tight">{t}</div><div className="text-sm opacity-95">{m}</div></div>
        </div>
        <div className="mt-4 rounded-2xl bg-indigo-50 border border-indigo-100 p-4">
          <div className="text-sm font-bold text-indigo-900 mb-1">Resume Match Summary</div>
          <p className="text-sm text-slate-700">{summaryText(r)}</p>
        </div>
        <div className="flex flex-wrap justify-around gap-4 my-5">
          <Ring id={"rm" + r.id} value={r.match_score} label="Match Score" />
          <Ring id={"ra" + r.id} value={r.ats_score} label="ATS Score" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {tiles.map(([ico, v, l, c]) => (
            <div key={l} className={`rounded-2xl p-3 text-center ${c}`}><div>{ico}</div><div className="text-xl font-extrabold">{v}</div><div className="text-xs">{l}</div></div>
          ))}
        </div>
        <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-200 p-4">
          <div className="font-semibold text-slate-800 mb-3">Ready to improve your resume?</div>
          <div className="flex flex-wrap gap-2">
            <button onClick={onAgain} className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90">🔄 Analyze Again</button>
            <button onClick={onDownload} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100">📄 Download Report</button>
            <button onClick={onNew} className="px-4 py-2 rounded-xl text-sm font-semibold text-indigo-700 border border-indigo-300 hover:bg-indigo-50">➕ New Analysis</button>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Tip: in the print window that opens, choose “Save as PDF”.</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Side panels ---------- */
export function BreakdownCard({ r }) {
  return (
    <Glass icon="📊" title="ATS Breakdown">
      {Object.entries(r.ats_breakdown || {}).map(([k, v]) => {
        const max = MAXES[k] || 10;
        return (
          <div key={k} className="mb-3 last:mb-0">
            <div className="flex justify-between text-sm"><span className="text-indigo-100">{LABELS[k] || k}</span><span className="font-semibold">{v}/{max}</span></div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden mt-1"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" style={{ width: Math.min(100, (v / max) * 100) + "%" }} /></div>
          </div>
        );
      })}
    </Glass>
  );
}

export function KeywordsCard({ r }) {
  const missing = r.missing_keywords || [];
  const imp = (v) => (v >= 70 ? "bg-red-500/20 text-red-200" : v >= 40 ? "bg-orange-500/20 text-orange-200" : "bg-amber-500/20 text-amber-200");
  return (
    <Glass icon="⚠️" title="Missing Keywords">
      {missing.length ? (
        <>
          <div className="flex flex-wrap gap-2 mb-3">{missing.map((m) => <Chip key={m.keyword} cls="bg-pink-500/20 text-pink-200 ring-1 ring-pink-400/30">{m.keyword}</Chip>)}</div>
          <ul className="space-y-2 max-h-72 overflow-auto pr-1">
            {missing.map((m) => (
              <li key={m.keyword} className="rounded-xl bg-white/5 px-3 py-2">
                <div className="flex items-center justify-between gap-2"><span className="font-semibold text-sm">{m.keyword}</span><span className={`text-[10px] px-2 py-0.5 rounded-full ${imp(m.importance)}`}>{impLabel(m.importance)} importance</span></div>
                <div className="text-xs text-indigo-200">Mentioned in job description but not found in your resume.</div>
              </li>
            ))}
          </ul>
        </>
      ) : <p className="text-sm text-emerald-300">🎉 No important keywords missing!</p>}
    </Glass>
  );
}

export function SkillsCard({ r }) {
  const matched = r.matched_keywords || [], missing = r.missing_keywords || [];
  const older = matched.length === 0 && (r.ats_breakdown?.keywords || 0) > 0;
  return (
    <Glass icon="🎯" title="Skills Match">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs font-semibold text-emerald-300 mb-2">✅ Matched Skills</div>
          <div className="flex flex-wrap gap-1.5">
            {matched.length ? matched.map((k) => <Chip key={k} cls="bg-emerald-500/20 text-emerald-200">{k}</Chip>) : <span className="text-xs text-indigo-300">{older ? "Not tracked for older analyses." : "None found."}</span>}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-pink-300 mb-2">❌ Missing Skills</div>
          <div className="flex flex-wrap gap-1.5">
            {missing.length ? missing.map((m) => <Chip key={m.keyword} cls="bg-pink-500/20 text-pink-200">{m.keyword}</Chip>) : <span className="text-xs text-indigo-300">Nothing missing 🎉</span>}
          </div>
        </div>
      </div>
    </Glass>
  );
}

export function SuggestionsCard({ r }) {
  const list = normSuggestions(r.suggestions);
  return (
    <Glass icon="💡" title="Resume Improvement Suggestions">
      {["high", "medium", "low"].map((p) => {
        const items = list.filter((s) => s.priority === p);
        if (!items.length) return null;
        return (
          <div key={p} className="mb-3 last:mb-0">
            <div className="text-xs font-bold mb-1.5">{PRIORITY[p][0]} {PRIORITY[p][1]}</div>
            <ul className="space-y-1.5">{items.map((s, i) => <li key={i} className="rounded-xl bg-white/5 px-3 py-2 text-sm text-indigo-50">{s.text}</li>)}</ul>
          </div>
        );
      })}
    </Glass>
  );
}

/* ---------- History ---------- */
const ChartTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white rounded-lg shadow-lg border p-3 text-sm text-slate-700">
      <div className="font-semibold">{d.name}</div><div className="text-xs text-slate-500 mb-1">{d.time}</div>
      <div className="text-indigo-600">Match: {d.Match}%</div><div className="text-emerald-600">ATS: {d.ATS}%</div>
    </div>
  );
};

export function HistoryRows({ list, onOpen, onDelete, empty = "No analyses yet." }) {
  if (!list.length) return <p className="text-sm text-indigo-300 py-4 text-center">{empty}</p>;
  return (
    <ul className="space-y-2">
      {list.map((h) => (
        <li key={h.id} onClick={() => onOpen(h)} className="flex flex-wrap items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 ring-1 ring-white/10 p-3 cursor-pointer transition">
          <span className="text-xl">📄</span>
          <div className="basis-[calc(100%-3rem)] sm:basis-auto sm:flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{h.resume_name || "Resume (older entry)"}</div>
            <div className="text-[11px] text-indigo-300">🕒 {fmt(h.created_at)}</div>
          </div>
          <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${tone(h.match_score)}`}>Match {Math.round(h.match_score)}%</span>
          <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${tone(h.ats_score)}`}>ATS {Math.round(h.ats_score)}%</span>
          <button title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(h.id); }} className="text-indigo-300 hover:text-red-400 px-1">🗑️</button>
        </li>
      ))}
    </ul>
  );
}

export const matches = (list, q) => list.filter((h) => (h.resume_name || "").toLowerCase().includes(q.trim().toLowerCase()));

export function HistorySection({ history, query, onOpen, onDelete, onViewAll }) {
  const data = [...history].reverse().map((h, i) => ({ n: i + 1, name: h.resume_name || "Resume", time: fmt(h.created_at), Match: h.match_score, ATS: h.ats_score }));
  const best = (k) => (history.length ? Math.round(Math.max(...history.map((h) => h[k]))) : 0);
  const avg = history.length ? Math.round(history.reduce((a, h) => a + h.ats_score, 0) / history.length) : 0;
  const stats = [["📊", history.length, "Analyses"], ["🏆", best("match_score") + "%", "Best match"], ["🎯", best("ats_score") + "%", "Best ATS"], ["⚡", avg + "%", "Avg ATS"]];
  const recent = matches(history, query).slice(0, 3);
  return (
    <Glass icon="📈" title="Score history">
      <p className="text-sm text-indigo-200 -mt-2 mb-4">Track how your resume improves with every analysis.</p>
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-3 grid grid-cols-2 gap-3 content-start">
          {stats.map(([ico, v, l]) => <div key={l} className="rounded-2xl bg-white/10 p-3 text-center"><div>{ico}</div><div className="text-xl font-extrabold">{v}</div><div className="text-[11px] text-indigo-200">{l}</div></div>)}
        </div>
        <div className="lg:col-span-5">
          {data.length >= 2 ? (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="gM" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} /></linearGradient>
                  <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.5} /><stop offset="95%" stopColor="#10b981" stopOpacity={0.02} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="n" tickFormatter={(v) => "#" + v} stroke="#a5b4fc" />
                <YAxis domain={[0, 100]} unit="%" stroke="#a5b4fc" />
                <Tooltip content={<ChartTip />} />
                <Legend />
                <Area type="monotone" dataKey="Match" stroke="#818cf8" strokeWidth={3} fill="url(#gM)" dot={{ r: 4 }} activeDot={{ r: 7 }} />
                <Area type="monotone" dataKey="ATS" stroke="#34d399" strokeWidth={3} fill="url(#gA)" dot={{ r: 4 }} activeDot={{ r: 7 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full min-h-[200px] rounded-2xl border border-dashed border-white/20 grid place-items-center text-center p-6">
              <div><div className="text-4xl mb-2">📊</div><div className="font-semibold">Your progress will appear here</div><p className="text-sm text-indigo-200 mt-1">Analyze your resume multiple times to track how your ATS and job-match scores improve.</p></div>
            </div>
          )}
        </div>
        <div className="lg:col-span-4">
          <div className="flex justify-between items-center mb-2"><span className="text-sm font-semibold">Recent analyses</span><button onClick={onViewAll} className="text-xs text-fuchsia-300 hover:underline">View all</button></div>
          <HistoryRows list={recent} onOpen={onOpen} onDelete={onDelete} empty={query ? "No analyses match your search." : "No analyses yet."} />
        </div>
      </div>
    </Glass>
  );
}

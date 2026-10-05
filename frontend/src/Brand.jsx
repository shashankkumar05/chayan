import { useState } from "react";

export function Logo({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Chayan logo">
      <defs>
        <linearGradient id="chayanGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" /><stop offset="0.55" stopColor="#a855f7" /><stop offset="1" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#chayanGrad)" />
      <path d="M43.3 20.7A16 16 0 1 0 43.3 43.3" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
      <path d="M26 33l5 5 10-11" fill="none" stroke="#fde68a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark({ size = 44, dark = false }) {
  return (
    <div className="flex items-center gap-3">
      <Logo size={size} />
      <div>
        <div className={`text-2xl font-extrabold leading-none ${dark ? "text-slate-900" : "text-white"}`}>
          Chay<span className="bg-gradient-to-r from-sky-400 to-fuchsia-500 bg-clip-text text-transparent">an</span>
        </div>
        <div className={`text-xs mt-1 ${dark ? "text-slate-500" : "text-indigo-200"}`}>Analyze. Match. Get Selected.</div>
      </div>
    </div>
  );
}

// Short starter texts, not legal advice. Review before a public launch.
const DOCS = {
  "Privacy Policy": [
    "We store your name, username, email and an encrypted (hashed) password.",
    "For each analysis we store the resume file name, the job description you pasted and the scores. The PDF file itself is not saved.",
    "We use this only to run Chayan and show your history. We do not sell your data. You can delete any analysis from your history.",
    "The site owner may be notified (name, username, email) when an account is created or used. To delete your account, contact us.",
  ],
  Terms: [
    "Chayan is a free tool. Scores come from keyword matching and rule-based checks, so they are estimates, not a guarantee of shortlisting or selection.",
    "Only upload documents you have the right to share. Do not misuse the service.",
    "We may change or stop the service at any time.",
  ],
};

export function Footer() {
  const [open, setOpen] = useState(null);
  const contact = import.meta.env.VITE_CONTACT_EMAIL;
  const link = "hover:text-white transition";
  return (
    <footer className="border-t border-white/10 mt-6">
      <div className="max-w-7xl mx-auto px-5 py-5 flex flex-wrap items-center justify-between gap-4 text-xs text-indigo-200">
        <div className="flex items-center gap-3">
          <Logo size={32} />
          <div>
            <div className="text-sm font-semibold text-white">Chayan <span className="font-normal text-indigo-300">| Analyze. Match. Get Selected.</span></div>
            <div>Built to help you get one step closer to your next opportunity.</div>
          </div>
        </div>
        <nav className="flex gap-4">
          {Object.keys(DOCS).map((k) => <button key={k} onClick={() => setOpen(k)} className={link}>{k}</button>)}
          {contact && <a href={`mailto:${contact}`} className={link}>Contact</a>}
        </nav>
        <div>© {new Date().getFullYear()} Chayan. All rights reserved.</div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <div className="bg-white text-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-3">{open}</h3>
            <ul className="space-y-2 text-sm list-disc ml-5">{DOCS[open].map((t) => <li key={t}>{t}</li>)}</ul>
            <button onClick={() => setOpen(null)} className="mt-5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium">Close</button>
          </div>
        </div>
      )}
    </footer>
  );
}

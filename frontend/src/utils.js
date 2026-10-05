export const fmt = (d) =>
  new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

export const MAXES = { keywords: 50, sections: 15, action_verbs_results: 15, contact_links: 10, length_formatting: 10 };
export const LABELS = { keywords: "Keyword Match", sections: "Standard Sections", action_verbs_results: "Action Verbs & Results", contact_links: "Contact & Links", length_formatting: "Length & Format" };
export const PRIORITY = { high: ["🔴", "High Priority"], medium: ["🟡", "Medium Priority"], low: ["🟢", "Low Priority"] };

export const overall = (r) => (r.match_score + r.ats_score) / 2;
export const grade = (v) => (v >= 90 ? "A+" : v >= 80 ? "A" : v >= 70 ? "B+" : v >= 60 ? "B" : v >= 50 ? "C" : "D");
export const atsWord = (v) => (v >= 85 ? "an excellent" : v >= 70 ? "a strong" : v >= 50 ? "a fair" : "a low");
export const summaryText = (r) =>
  `Your resume matches ${Math.round(r.match_score)}% of this job description and has ${atsWord(r.ats_score)} ATS score of ${Math.round(r.ats_score)}%.`;
export const tone = (v) => (v >= 70 ? "bg-green-100 text-green-700" : v >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700");
export const impLabel = (v) => (v >= 70 ? "High" : v >= 40 ? "Medium" : "Low");
export const verdict = (v) => (v >= 75 ? "🚀 Excellent" : v >= 50 ? "👍 Good" : v >= 30 ? "🛠️ Needs work" : "⚠️ Weak match");
export const banner = (v) =>
  v >= 80 ? ["🏆", "Outstanding!", "Your resume is a strong match. Apply with confidence.", "from-emerald-500 to-teal-500"]
  : v >= 60 ? ["🎉", "Great job!", "This looks good, a solid match. A few tweaks can make it even better.", "from-emerald-500 to-lime-500"]
  : v >= 40 ? ["👍", "Decent start", "You're getting there. Add the missing keywords below to level up.", "from-amber-500 to-orange-500"]
  : ["🛠️", "Needs work", "Tailor your resume to this role using the suggestions below.", "from-rose-500 to-orange-500"];

// Older analyses stored plain-text suggestions; newer ones are {priority, text}.
const guess = (t) => (/keyword|Add a clear|Add your/i.test(t) ? "high" : /action verbs|Quantify|measurable/i.test(t) ? "medium" : "low");
export const normSuggestions = (list = []) => list.map((s) => (typeof s === "string" ? { text: s, priority: guess(s) } : s));

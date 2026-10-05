import re
import pdfplumber
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS, TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

ACTION_VERBS = {"built", "developed", "designed", "implemented", "led", "created", "optimized",
    "improved", "deployed", "integrated", "automated", "reduced", "increased", "managed",
    "engineered", "launched", "architected", "delivered", "collaborated", "tested"}
SECTIONS = {"summary": r"summary|objective|profile", "skills": r"skills", "projects": r"projects?",
            "education": r"education"}

def extract_text(file):
    with pdfplumber.open(file) as pdf:
        return "\n".join((p.extract_text() or "") for p in pdf.pages).strip()

SKILLS = {
    "python": ["python"], "java": ["java"], "javascript": ["javascript", "js", "es6"], "typescript": ["typescript"],
    "c++": ["c++"], "c#": ["c#"], "sql": ["sql"], "mysql": ["mysql"], "postgresql": ["postgresql", "postgres"],
    "mongodb": ["mongodb"], "html": ["html", "html5"], "css": ["css", "css3"], "tailwind css": ["tailwind"],
    "react": ["react", "reactjs", "react.js"], "node.js": ["node.js", "nodejs", "node"], "express": ["express", "express.js"],
    "angular": ["angular"], "vue": ["vue", "vue.js"], "next.js": ["next.js", "nextjs"], "redux": ["redux"],
    "django": ["django"], "django rest framework": ["drf", "django rest framework"], "flask": ["flask"],
    "fastapi": ["fastapi"], "spring boot": ["spring boot", "spring"], "rest api": ["rest", "restful", "rest api", "rest apis"],
    "graphql": ["graphql"], "jwt": ["jwt"], "git": ["git"], "github": ["github"], "docker": ["docker"],
    "kubernetes": ["kubernetes", "k8s"], "aws": ["aws"], "azure": ["azure"], "gcp": ["gcp", "google cloud"],
    "linux": ["linux"], "ci/cd": ["ci/cd", "cicd"], "postman": ["postman"], "swagger": ["swagger", "openapi"],
    "pandas": ["pandas"], "numpy": ["numpy"], "scikit-learn": ["scikit-learn", "sklearn"], "tensorflow": ["tensorflow"],
    "pytorch": ["pytorch"], "machine learning": ["machine learning", "ml"], "deep learning": ["deep learning"],
    "nlp": ["nlp", "natural language processing"], "llm": ["llm", "llms", "large language models"],
    "ai": ["ai", "artificial intelligence"], "generative ai": ["generative ai", "genai"],
    "prompt engineering": ["prompt engineering", "prompts"], "data structures": ["data structures"],
    "algorithms": ["algorithms"], "oop": ["oop", "object-oriented", "object oriented"], "agile": ["agile", "scrum"],
    "microservices": ["microservices"], "unit testing": ["unit testing", "unit tests", "pytest", "jest"],
    "debugging": ["debugging", "debug"], "code review": ["code review", "code reviews"],
    "responsive design": ["responsive design", "responsive"], "api": ["api", "apis"],
    "full stack": ["full stack", "full-stack", "fullstack"], "front-end": ["front-end", "frontend", "front end"],
    "back-end": ["back-end", "backend", "back end"], "data analysis": ["data analysis", "data analytics"],
    "power bi": ["power bi", "powerbi"], "excel": ["excel"], "tableau": ["tableau"], "figma": ["figma"],
}
EXTRA_STOP = {"work", "help", "available", "choosing", "creating", "directly", "looking", "join", "role", "job", "team",
    "experience", "ability", "including", "etc", "will", "you", "your", "our", "new", "high", "quality", "also", "well"}
STOP = list(ENGLISH_STOP_WORDS | EXTRA_STOP)
TOKEN = r"(?u)\b[a-zA-Z][a-zA-Z+#]{2,}\b"

NICE = {"aws": "AWS", "sql": "SQL", "mysql": "MySQL", "postgresql": "PostgreSQL", "mongodb": "MongoDB", "html": "HTML",
        "css": "CSS", "jwt": "JWT", "nlp": "NLP", "llm": "LLM", "ai": "AI", "oop": "OOP", "ci/cd": "CI/CD", "gcp": "GCP",
        "api": "API", "rest api": "REST API", "node.js": "Node.js", "next.js": "Next.js", "typescript": "TypeScript",
        "javascript": "JavaScript", "github": "GitHub", "graphql": "GraphQL", "fastapi": "FastAPI", "powerbi": "Power BI"}

def nice(k):
    return NICE.get(k, k.title())

def clean(t):
    return re.sub(r"\s+", " ", t.lower())

def count_alias(text, alias):
    return len(re.findall(r"(?<![a-z0-9+#.])" + re.escape(alias) + r"(?![a-z0-9+#])", text))

def skill_counts(text):
    t = clean(text)
    return {skill: sum(count_alias(t, a) for a in aliases) for skill, aliases in SKILLS.items()}

def match_and_keywords(resume, jd, top_n=30):
    vec = TfidfVectorizer(stop_words=STOP, ngram_range=(1, 2), token_pattern=TOKEN)
    m = vec.fit_transform([clean(resume), clean(jd)])
    cos = float(cosine_similarity(m[0], m[1])[0][0])
    cos_scaled = min(cos / 0.35, 1.0) * 100

    jd_sk, res_sk = skill_counts(jd), skill_counts(resume)
    needed = {k: v for k, v in jd_sk.items() if v > 0}
    if needed:
        top = max(needed.values())
        present = [k for k in needed if res_sk[k] > 0]
        missing = sorted(((k, max(30, round(v / top * 100))) for k, v in needed.items() if res_sk[k] == 0),
                         key=lambda x: -x[1])[:15]
        coverage = len(present) / len(needed)
        match = 0.7 * coverage * 100 + 0.3 * cos_scaled
        return round(match, 1), coverage, [(nice(k), v) for k, v in missing], [nice(k) for k in present]

    # Fallback for non-technical JDs: plain TF-IDF keywords
    terms = list(vec.get_feature_names_out())
    jd_w, res_w = m[1].toarray()[0], m[0].toarray()[0]
    ranked = sorted(((terms[i], jd_w[i]) for i in range(len(terms)) if jd_w[i] > 0), key=lambda x: -x[1])[:top_n]
    top = max((w for _, w in ranked), default=1) or 1
    present = [k for k, _ in ranked if res_w[terms.index(k)] > 0]
    missing = [(k, round(w / top * 100, 1)) for k, w in ranked if k not in present][:15]
    coverage = len(present) / max(len(ranked), 1)
    return round(0.5 * coverage * 100 + 0.5 * cos_scaled, 1), coverage, missing, present[:15]

def ats_score(resume, coverage):
    low = resume.lower()
    b = {"keywords": round(coverage * 50, 1)}
    found = [s for s, p in SECTIONS.items() if re.search(p, low)]
    b["sections"] = round(len(found) / 4 * 15, 1)
    words = re.findall(r"[a-z]+", low)
    verbs = len([w for w in words if w in ACTION_VERBS])
    nums = len(re.findall(r"\d+%|\d+\+|\$\d+|\b\d{2,}\b", resume))
    b["action_verbs_results"] = round(min(verbs, 8) / 8 * 8 + min(nums, 5) / 5 * 7, 1)
    contact = [bool(re.search(r"[\w.+-]+@[\w-]+\.\w+", resume)), bool(re.search(r"\+?\d[\d\s-]{8,}\d", resume)),
               "linkedin.com" in low, "github.com" in low]
    b["contact_links"] = round(sum(contact) * 2.5, 1)
    n = len(words)
    b["length_formatting"] = 10 if 300 <= n <= 900 else 6 if 150 <= n < 300 or 900 < n <= 1200 else 3
    return round(sum(b.values()), 1), b, {"sections": found, "contact": contact, "verbs": verbs, "numbers": nums, "words": n}

def suggestions(breakdown, info, missing):
    """Prioritised tips: each item is {"priority": high|medium|low, "text": ...}."""
    out = []
    for k, _ in missing[:3]:
        out.append({"priority": "high", "text": f"Add {k} experience if you have relevant experience."})
    for name in SECTIONS:
        if name not in info["sections"]:
            out.append({"priority": "high", "text": f"Add a clear '{name.title()}' section."})
    for label, ok in zip(["email", "phone", "LinkedIn", "GitHub"], info["contact"]):
        if not ok:
            out.append({"priority": "medium", "text": f"Add your {label} to the header."})
    if info["verbs"] < 8:
        out.append({"priority": "medium", "text": "Start bullets with strong action verbs (built, optimized, deployed)."})
    if info["numbers"] < 5:
        out.append({"priority": "medium", "text": "Mention measurable results in your projects (e.g. 'cut load time by 40%', 'served 500+ users')."})
    if breakdown["length_formatting"] < 10:
        out.append({"priority": "low", "text": "Keep the resume concise (300-900 words) and preferably one page for fresher roles."})
    if not out:
        out.append({"priority": "low", "text": "Great work! Tailor your top bullets to each job description before applying."})
    return out

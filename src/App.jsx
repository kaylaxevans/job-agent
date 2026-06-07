import { useState, useEffect, useRef } from "react";

const DEFAULT_RESUME = `KAYLA C. EVANS
Kayla.c.evans@outlook.com | (760) 908 8347 | San Diego, CA

EDUCATION
UC San Diego, School of Global Policy and Strategy
MA in International Affairs, Specialty in International Management (GPA: 3.5) - June 2026
BA in International Business - June 2025
Relevant Coursework: International Business, Global Business Strategy, International Economics, Quantitative Methods I-II, Strategy & Negotiation, Product Marketing & Management

EXPERIENCE
UC San Diego - Rady School of Management
Teaching Assistant, Business & Organizational Leadership - June 2025-Present
- Managed grading workflows, academic records, and weekly deliverables for multiple course sections
- Coordinated with faculty on course materials, timelines, and office hours

SME Web Design
Marketing & Digital Strategy Intern - June 2025-Aug 2025
- Conducted market research, competitor analysis, and keyword research across client accounts
- Developed client website content and AI-powered chatbots using WordPress
- Created and scheduled LinkedIn posts, videos, and infographics
- Tracked tasks across multiple accounts using structured project workflows

Legal Aid Society of San Diego, Inc.
Clinic Volunteer - Sept 2024-Dec 2024
- Conducted client intake interviews; maintained case info in LegalServer
- Completed standardized court forms and eviction-related filings

UC San Diego - Parking and Transportation Services
Customer Service Representative - Sept 2023-July 2024
- Responded to 50+ daily inquiries; used ServiceNow and T2 to resolve issues

CoCo Rose Resort Wear
Sales Associate - April 2021-Aug 2024
- Supported POS transactions, inventory, and customer engagement

SKILLS
Microsoft Office, G-Suite, Canva, R Studio, WordPress, QGIS, Trello
Certifications: Real Estate Salesperson License, California
Languages: English (Native), Spanish (Intermediate)`;

const STEPS = [
  { id: "read",    label: "Reading job description",     icon: "📄" },
  { id: "analyze", label: "Analyzing requirements",      icon: "🔍" },
  { id: "compare", label: "Comparing to your resume",    icon: "⚖️" },
  { id: "cover",   label: "Writing cover letter",        icon: "✍️" },
  { id: "rewrite", label: "Analyzing resume improvements", icon: "🔄" },
  { id: "network", label: "Finding networking targets",  icon: "🤝" },
  { id: "gaps",    label: "Building your action plan",   icon: "🎯" },
  { id: "interview", label: "Generating interview questions", icon: "🎤" },
];

const TABS = [
  { id: "cover",        label: "Cover Letter" },
  { id: "rewrite",      label: "Resume Tips" },
  { id: "network",      label: "Networking" },
  { id: "gaps",         label: "Action Plan" },
  { id: "interview",    label: "Interview Prep" },
  { id: "requirements", label: "Requirements" },
];

const STATUS_COLORS = {
  "Not Applied":  { text: "#888", bg: "#f5f5f5", border: "#ddd" },
  "Applied":      { text: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  "Interviewing": { text: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  "Offer":        { text: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  "Rejected":     { text: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

// Render markdown bold (**text**) as <strong>
function RenderMarkdown({ text, style }) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*|##[^\n]+)/g);
  return (
    <p style={{ margin: 0, ...style }}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("## ")) {
          return <strong key={i} style={{ display: "block", marginTop: "12px" }}>{part.slice(3)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

export default function JobAgent() {
  const [jobText, setJobText]                       = useState("");
  const [running, setRunning]                       = useState(false);
  const [currentStep, setCurrentStep]               = useState(-1);
  const [completedSteps, setCompletedSteps]         = useState([]);
  const [results, setResults]                       = useState(null);
  const [activeTab, setActiveTab]                   = useState("cover");
  const [error, setError]                           = useState(null);
  const [dots, setDots]                             = useState("");
  const [view, setView]                             = useState("agent");
  const [applications, setApplications]             = useState([]);
  const [copiedMsg, setCopiedMsg]                   = useState("");
  const [selectedNetworkIdx, setSelectedNetworkIdx] = useState(0);
  const [resumeText, setResumeText]                 = useState(DEFAULT_RESUME);
  const [resumeName, setResumeName]                 = useState("Kayla C. Evans (default)");
  const [resumeLoading, setResumeLoading]           = useState(false);
  const [interviewQuestions, setInterviewQuestions]   = useState([]);
  const [dragOver, setDragOver]                     = useState(false);
  const fileInputRef                                = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("jobAgentApps");
      if (saved) setApplications(JSON.parse(saved));
    } catch {}
  }, []);

  const saveApps = (updater) => {
    setApplications(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try { localStorage.setItem("jobAgentApps", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => setDots(d => d.length >= 3 ? "" : d + "."), 400);
    return () => clearInterval(iv);
  }, [running]);

  useEffect(() => {
    if (!window.pdfjsLib) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      };
      document.head.appendChild(script);
    }
  }, []);

  const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map(item => item.str).join(" ") + "\n";
    }
    return fullText.trim();
  };

  const handleResumeFile = async (file) => {
    if (!file) return;
    setResumeLoading(true);
    setError(null);
    try {
      let text = "";
      if (file.type === "application/pdf") {
        text = await extractTextFromPDF(file);
      } else if (file.type === "text/plain") {
        text = await file.text();
      } else {
        setError("Please upload a PDF or .txt file.");
        setResumeLoading(false);
        return;
      }
      if (!text || text.length < 50) {
        setError("Could not read resume text. Try a different file.");
        setResumeLoading(false);
        return;
      }
      setResumeText(text);
      setResumeName(file.name);
    } catch (e) {
      setError("Failed to read resume file. Please try again.");
    } finally {
      setResumeLoading(false);
    }
  };

  const callClaude = async (prompt) => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.content[0].text;
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedMsg(label);
    setTimeout(() => setCopiedMsg(""), 2000);
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  const runAgent = async () => {
    if (!jobText.trim()) return;
    setRunning(true);
    setCompletedSteps([]);
    setCurrentStep(0);
    setResults(null);
    setError(null);
    setActiveTab("cover");
    setSelectedNetworkIdx(0);
    const RESUME = resumeText;

    try {
      await new Promise(r => setTimeout(r, 800));
      setCompletedSteps(["read"]);
      setCurrentStep(1);

      await new Promise(r => setTimeout(r, 600));
      const reqRaw = await callClaude(`Extract the top 6-8 key requirements from this job posting as a JSON array of short strings. Return ONLY the JSON array, no markdown:\n\n${jobText}`);
      let requirements = [];
      try { requirements = JSON.parse(reqRaw.replace(/```json|```/g, "").trim()); }
      catch { requirements = reqRaw.split("\n").filter(l => l.trim()).slice(0, 8); }
      setCompletedSteps(s => [...s, "analyze"]);
      setCurrentStep(2);

      await new Promise(r => setTimeout(r, 600));
      const matchRaw = await callClaude(`Given this resume:\n${RESUME}\n\nAnd these job requirements:\n${requirements.join("\n")}\n\nReturn a JSON object with two arrays: "matches" (requirements clearly met) and "gaps" (requirements missing or weak). Return ONLY the JSON object, no markdown.`);
      let matchData = { matches: [], gaps: [] };
      try { matchData = JSON.parse(matchRaw.replace(/```json|```/g, "").trim()); }
      catch { matchData = { matches: requirements.slice(0, 4), gaps: requirements.slice(4) }; }
      setCompletedSteps(s => [...s, "compare"]);
      setCurrentStep(3);

      await new Promise(r => setTimeout(r, 600));
      const coverBody = await callClaude(`Write a professional, tailored cover letter body for the candidate applying to this job:\n\n${jobText}\n\nTheir resume:\n${RESUME}\n\nIMPORTANT: Return ONLY the body paragraphs. Do NOT include a date, salutation, or closing signature — those will be added automatically. Make it compelling and under 250 words. No generic filler.`);
      setCompletedSteps(s => [...s, "cover"]);
      setCurrentStep(4);

      await new Promise(r => setTimeout(r, 600));
      const resumeRewrite = await callClaude(`You are a professional resume coach. Analyze this resume against the job posting.

CRITICAL: Your response must start with { and end with }. No markdown. No backticks. No json label. Just raw JSON.

Return a JSON object with exactly these two fields:
- "suggestions": array of 5-7 objects, each with "issue" and "fix" strings
- "rewrittenBullets": a single string with rewritten bullets for the 3 most relevant experience sections

Job posting:
${jobText}

Resume:
${RESUME}`);
      let resumeData = { suggestions: [], rewrittenBullets: "" };
      try {
        const firstBrace = resumeRewrite.indexOf("{");
        const lastBrace = resumeRewrite.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1) {
          const cleanResume = resumeRewrite.slice(firstBrace, lastBrace + 1);
          resumeData = JSON.parse(cleanResume);
        }
        if (!resumeData.suggestions) resumeData.suggestions = [];
        if (!resumeData.rewrittenBullets) resumeData.rewrittenBullets = "";
      } catch {
        resumeData = { suggestions: [], rewrittenBullets: "" };
      }
      setCompletedSteps(s => [...s, "rewrite"]);
      setCurrentStep(5);

      await new Promise(r => setTimeout(r, 600));
      const networkRaw = await callClaude(`Based on this job posting, suggest 4 types of people at this company to connect with on LinkedIn. For each: a job title to search for, why they're worth connecting with, and a short personalized LinkedIn message (under 80 words). Return as a JSON array with fields: "title", "reason", "message". Return ONLY the JSON array, no markdown.\n\nJob posting:\n${jobText}\n\nCandidate resume:\n${RESUME}`);
      let networkTargets = [];
      try { networkTargets = JSON.parse(networkRaw.replace(/```json|```/g, "").trim()); }
      catch { networkTargets = [{ title: "Hiring Manager", reason: "Direct decision maker for this role", message: "Hi, I recently applied for this role and would love to connect and learn more about the team." }]; }
      setCompletedSteps(s => [...s, "network"]);
      setCurrentStep(6);

      await new Promise(r => setTimeout(r, 600));
      const gapAdvice = await callClaude(`Based on these skill gaps:\n${matchData.gaps.join("\n")}\n\nGive 4 specific, actionable tips the candidate can use to address these gaps quickly. Be direct and practical. Format as a numbered list.`);
      setCompletedSteps(s => [...s, "gaps"]);
      setCurrentStep(7);

      await new Promise(r => setTimeout(r, 600));
      const interviewRaw = await callClaude(`Based on this job posting and candidate resume, generate 6 likely interview questions with brief suggested answers. Format as a JSON array of objects with fields: "question" and "answer". Return ONLY the JSON array, no markdown.\n\nJob posting:\n${jobText}\n\nResume:\n${RESUME}`);
      let interviewQs = [];
      try { interviewQs = JSON.parse(interviewRaw.replace(/```json|```/g, "").trim()); }
      catch { interviewQs = []; }
      setCompletedSteps(s => [...s, "interview"]);
      setCurrentStep(-1);

      const titleRaw = await callClaude(`What is the job title and company name from this posting? Reply with ONLY: "Job Title at Company Name", nothing else.\n\n${jobText}`);

      // Extract candidate name from resume
      const nameRaw = await callClaude(`What is the full name of the candidate from this resume? Reply with ONLY their full name, nothing else.\n\n${RESUME}`);

      const newResult = {
        title: titleRaw.trim(),
        candidateName: nameRaw.trim(),
        requirements,
        matches: matchData.matches || [],
        gaps: matchData.gaps || [],
        coverBody,
        resumeRewrite: resumeData.rewrittenBullets,
        resumeSuggestions: resumeData.suggestions || [],
        networkTargets,
        gapAdvice,
        interviewQuestions: interviewQs,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        formattedDate: getFormattedDate(),
        status: "Not Applied",
        id: Date.now(),
      };

      setResults(newResult);
      saveApps(prev => [newResult, ...prev]);

    } catch (e) {
      setError("Something went wrong: " + e.message);
    } finally {
      setRunning(false);
    }
  };

  const updateStatus = (id, status) => saveApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  const deleteApp = (id) => saveApps(prev => prev.filter(a => a.id !== id));

  const getFullCoverLetter = (result) => {
    return `${result.formattedDate}\n\nDear Hiring Manager,\n\n${result.coverBody}\n\nSincerely,\n${result.candidateName}`;
  };

  // ── Styles (light mode) ──────────────────────────────────────────────
  const s = {
    page:      { minHeight: "100vh", background: "#f8f7f4", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", color: "#1a1a2e", width: "100%" },
    header:    { borderBottom: "1px solid #e5e2db", padding: "18px 48px", display: "flex", alignItems: "center", background: "#ffffff", justifyContent: "space-between", width: "100%", boxSizing: "border-box" },
    logo:      { fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: 900, color: "#1a1a2e", margin: 0 },
    nav:       { display: "flex", gap: "4px" },
    navBtn:    (active) => ({ background: active ? "#1a1a2e" : "none", border: active ? "1px solid #1a1a2e" : "1px solid #ddd", borderRadius: "6px", padding: "7px 16px", color: active ? "#ffffff" : "#888", fontFamily: "inherit", fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s" }),
    container: { maxWidth: "900px", margin: "0 auto", padding: "40px 24px" },
    label:     { display: "block", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "#aaa", marginBottom: "10px" },
    card:      { background: "#ffffff", border: "1px solid #e5e2db", borderRadius: "10px", padding: "28px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
    tabBar:    { display: "flex", borderBottom: "1px solid #e5e2db", marginBottom: "24px", gap: 0, overflowX: "auto" },
    tabBtn:    (active) => ({ background: "none", border: "none", borderBottom: active ? "2px solid #1a1a2e" : "2px solid transparent", padding: "10px 18px", color: active ? "#1a1a2e" : "#aaa", fontFamily: "inherit", fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap", marginBottom: "-1px", transition: "all 0.2s" }),
    copyBtn:   { background: "none", border: "1px solid #ddd", borderRadius: "6px", padding: "7px 14px", color: "#888", fontFamily: "inherit", fontSize: "11px", cursor: "pointer", letterSpacing: "1px", marginTop: "16px", transition: "all 0.2s" },
    pill:      (sc) => ({ display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", letterSpacing: "0.5px", border: `1px solid ${sc.border}`, color: sc.text, background: sc.bg }),
  };

  // ── TRACKER VIEW ─────────────────────────────────────────────────────
  if (view === "tracker") {
    return (
      <div style={s.page}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@700;900&display=swap');
          * { box-sizing: border-box; } button { transition: all 0.2s; } button:hover { opacity: 0.8; }
          .fade-in { animation: fadeIn 0.3s ease forwards; }
          @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        `}</style>
        <div style={s.header}>
          <h1 style={s.logo}>JobAgent</h1>
          <div style={s.nav}>
            <button style={s.navBtn(false)} onClick={() => setView("agent")}>← Agent</button>
            <button style={s.navBtn(true)}>Tracker</button>
          </div>
        </div>
        <div style={s.container}>
          <div style={{ marginBottom: "28px" }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "24px", color: "#1a1a2e", fontWeight: 700, marginBottom: "6px" }}>Application Tracker</div>
            <div style={{ fontSize: "13px", color: "#aaa" }}>{applications.length} application{applications.length !== 1 ? "s" : ""} saved</div>
          </div>
          {applications.length === 0 ? (
            <div style={{ ...s.card, textAlign: "center", padding: "60px 24px" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>📋</div>
              <div style={{ color: "#aaa", fontSize: "13px" }}>No applications yet. Run the agent on a job posting to get started.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {applications.map((app) => (
                <div key={app.id} className="fade-in" style={{ ...s.card, display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap", padding: "18px 24px" }}>
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ fontSize: "15px", color: "#1a1a2e", marginBottom: "3px", fontWeight: 600 }}>{app.title}</div>
                    <div style={{ fontSize: "12px", color: "#aaa" }}>{app.date}</div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <select value={app.status} onChange={e => updateStatus(app.id, e.target.value)} style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", padding: "6px 12px", color: STATUS_COLORS[app.status]?.text || "#888", fontFamily: "inherit", fontSize: "12px", cursor: "pointer" }}>
                      {Object.keys(STATUS_COLORS).map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => { setResults(app); setView("agent"); setActiveTab("cover"); }} style={{ background: "none", border: "1px solid #ddd", borderRadius: "6px", padding: "6px 14px", color: "#888", fontFamily: "inherit", fontSize: "11px", cursor: "pointer" }}>View</button>
                    <button onClick={() => deleteApp(app.id)} style={{ background: "none", border: "1px solid #fecaca", borderRadius: "6px", padding: "6px 14px", color: "#dc2626", fontFamily: "inherit", fontSize: "11px", cursor: "pointer" }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {applications.length > 0 && (
            <div style={{ marginTop: "24px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {Object.entries(STATUS_COLORS).map(([label, sc]) => <span key={label} style={s.pill(sc)}>{label}</span>)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── AGENT VIEW ───────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@700;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #f8f7f4; }
        textarea:focus { outline: none; border-color: #1a1a2e !important; }
        .run-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(26,26,46,0.2); }
        .run-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .fade-in { animation: fadeIn 0.35s ease forwards; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .pulse { animation: pulse 1.4s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .network-card { cursor: pointer; transition: all 0.2s; }
        .network-card:hover { border-color: #1a1a2e !important; }
        .network-card.selected { border-color: #1a1a2e !important; background: #f0f0f8 !important; }
        .drop-zone { transition: all 0.2s; cursor: pointer; }
        .drop-zone:hover, .drop-zone.drag-over { border-color: #1a1a2e !important; background: #f0f0f8 !important; }
        button { font-family: inherit; }
        select { font-family: inherit; }
      `}</style>

      <div style={s.header}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "14px" }}>
          <h1 style={s.logo}>JobAgent</h1>
          <span style={{ fontSize: "11px", color: "#bbb", letterSpacing: "2px", textTransform: "uppercase" }}>autonomous application assistant</span>
        </div>
        <div style={s.nav}>
          <button style={s.navBtn(true)}>Agent</button>
          <button style={s.navBtn(false)} onClick={() => setView("tracker")}>
            Tracker {applications.length > 0 && `(${applications.length})`}
          </button>
        </div>
      </div>

      <div style={s.container}>

        {/* Resume Upload */}
        <div style={{ marginBottom: "24px" }}>
          <label style={s.label}>Your Resume</label>
          <div
            className={`drop-zone${dragOver ? " drag-over" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleResumeFile(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current?.click()}
            style={{ background: "#fff", border: "1.5px dashed #ddd", borderRadius: "8px", padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ color: resumeName.includes("default") ? "#ddd" : "#16a34a", fontSize: "18px" }}>📄</span>
              <div>
                <div style={{ fontSize: "13px", color: resumeName.includes("default") ? "#aaa" : "#1a1a2e", fontWeight: 500 }}>
                  {resumeLoading ? "Reading resume..." : resumeName}
                </div>
                <div style={{ fontSize: "11px", color: "#bbb", marginTop: "2px" }}>
                  {resumeName.includes("default") ? "Click or drag to upload your resume PDF" : "Click to upload a different resume"}
                </div>
              </div>
            </div>
            <div style={{ fontSize: "11px", color: "#bbb", border: "1px solid #eee", borderRadius: "4px", padding: "4px 10px" }}>PDF / TXT</div>
          </div>
          <input ref={fileInputRef} type="file" accept=".pdf,.txt" style={{ display: "none" }} onChange={e => handleResumeFile(e.target.files[0])} />
        </div>

        {/* Job Description */}
        <div style={{ marginBottom: "20px" }}>
          <label style={s.label}>Paste Job Description</label>
          <textarea
            value={jobText}
            onChange={e => setJobText(e.target.value)}
            disabled={running}
            placeholder="Paste the full job posting here — title, company, responsibilities, requirements..."
            rows={8}
            style={{ width: "100%", background: "#fff", border: "1.5px solid #e5e2db", borderRadius: "8px", padding: "16px", color: "#1a1a2e", fontFamily: "inherit", fontSize: "14px", lineHeight: "1.6", resize: "vertical", transition: "border-color 0.2s" }}
          />
        </div>

        <button
          className="run-btn"
          onClick={runAgent}
          disabled={running || !jobText.trim() || resumeLoading}
          style={{ background: running ? "#eee" : "#1a1a2e", color: running ? "#aaa" : "#fff", border: "none", borderRadius: "8px", padding: "14px 32px", fontSize: "13px", fontWeight: 600, letterSpacing: "0.5px", cursor: running ? "not-allowed" : "pointer", marginBottom: "36px", transition: "all 0.25s" }}
        >
          {running ? `Running agent${dots}` : "▶  Run Agent"}
        </button>

        {/* Progress */}
        {(running || results) && (
          <div style={{ ...s.card, marginBottom: "32px" }}>
            <div style={s.label}>Agent Progress</div>
            {STEPS.map((step, i) => {
              const done = completedSteps.includes(step.id);
              const active = currentStep === i && running;
              return (
                <div key={step.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "9px 0", borderBottom: i < STEPS.length - 1 ? "1px solid #f0ede8" : "none", opacity: (!done && !active && running) ? 0.25 : 1, transition: "opacity 0.3s" }}>
                  <span style={{ fontSize: "16px", width: "24px", textAlign: "center" }}>{done ? "✅" : step.icon}</span>
                  <span style={{ fontSize: "13px", color: done ? "#16a34a" : active ? "#d97706" : "#aaa", fontWeight: active ? 600 : 400 }}>
                    {step.label}{active && <span className="pulse">{dots}</span>}
                  </span>
                  {done && <span style={{ marginLeft: "auto", fontSize: "10px", color: "#16a34a", letterSpacing: "1px" }}>DONE</span>}
                </div>
              );
            })}
          </div>
        )}

        {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "14px", color: "#dc2626", fontSize: "13px", marginBottom: "20px" }}>⚠ {error}</div>}

        {/* Results */}
        {results && (
          <div className="fade-in">
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "24px", color: "#1a1a2e", margin: "0 0 20px", fontWeight: 700 }}>{results.title}</h2>

            {/* Match / Gap */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "28px" }}>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "18px" }}>
                <div style={{ fontSize: "11px", letterSpacing: "2px", color: "#16a34a", marginBottom: "12px", textTransform: "uppercase", fontWeight: 600 }}>✓ Strong Matches</div>
                {results.matches.map((m, i) => <div key={i} style={{ fontSize: "13px", color: "#166534", marginBottom: "6px", lineHeight: "1.5" }}>· {m}</div>)}
              </div>
              <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "8px", padding: "18px" }}>
                <div style={{ fontSize: "11px", letterSpacing: "2px", color: "#d97706", marginBottom: "12px", textTransform: "uppercase", fontWeight: 600 }}>⚠ Skill Gaps</div>
                {results.gaps.map((g, i) => <div key={i} style={{ fontSize: "13px", color: "#92400e", marginBottom: "6px", lineHeight: "1.5" }}>· {g}</div>)}
              </div>
            </div>

            {/* Tabs */}
            <div style={s.tabBar}>
              {TABS.map(tab => <button key={tab.id} style={s.tabBtn(activeTab === tab.id)} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}
            </div>

            {/* Cover Letter */}
            {activeTab === "cover" && (
              <div className="fade-in" style={s.card}>
                <div style={s.label}>Tailored Cover Letter</div>
                <div style={{ fontSize: "14px", lineHeight: "1.9", color: "#333", textAlign: "left" }}>
                  <p style={{ margin: "0 0 16px", color: "#666" }}>{results.formattedDate}</p>
                  <p style={{ margin: "0 0 16px" }}>Dear Hiring Manager,</p>
                  <RenderMarkdown text={results.coverBody} style={{ fontSize: "14px", lineHeight: "1.9", color: "#333", whiteSpace: "pre-wrap", marginBottom: "16px", textAlign: "left" }} />
                  <p style={{ margin: "16px 0 4px" }}>Sincerely,</p>
                  <p style={{ margin: 0, fontWeight: 600 }}>{results.candidateName}</p>
                </div>
                <button style={s.copyBtn} onClick={() => copyToClipboard(getFullCoverLetter(results), "Copied!")}>
                  {copiedMsg === "Copied!" ? "✓ Copied!" : "Copy full cover letter"}
                </button>
              </div>
            )}

            {/* Resume Tips */}
            {activeTab === "rewrite" && (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={s.card}>
                  <div style={s.label}>Suggested Edits</div>
                  <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "16px", padding: "10px 14px", background: "#f8f7f4", borderRadius: "6px", border: "1px solid #eee", lineHeight: "1.5" }}>
                    These are specific changes to make to your resume before applying to this role.
                  </div>
                  {(results.resumeSuggestions || []).length === 0 ? (
                    <div style={{ color: "#aaa", fontSize: "13px" }}>No suggestions generated. Try running the agent again.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {(results.resumeSuggestions || []).map((item, i) => (
                        <div key={i} style={{ borderRadius: "8px", border: "1px solid #e5e2db", overflow: "hidden" }}>
                          <div style={{ background: "#fff7ed", padding: "10px 14px", borderBottom: "1px solid #fed7aa", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                            <span style={{ color: "#d97706", fontSize: "13px", marginTop: "1px" }}>Issue</span>
                            <span style={{ fontSize: "13px", color: "#92400e", fontWeight: 500, lineHeight: "1.5", marginLeft: "6px" }}>{item.issue}</span>
                          </div>
                          <div style={{ background: "#f0fdf4", padding: "10px 14px", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                            <span style={{ color: "#16a34a", fontSize: "13px", marginTop: "1px" }}>Fix</span>
                            <span style={{ fontSize: "13px", color: "#166534", lineHeight: "1.5", marginLeft: "6px" }}>{item.fix}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={s.card}>
                  <div style={s.label}>Rewritten Bullets</div>
                  <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "16px", padding: "10px 14px", background: "#f8f7f4", borderRadius: "6px", border: "1px solid #eee", lineHeight: "1.5" }}>
                    Copy these keyword-optimized bullets directly into your resume for this role.
                  </div>
                  <RenderMarkdown text={results.resumeRewrite} style={{ fontSize: "14px", lineHeight: "1.9", color: "#333", whiteSpace: "pre-wrap", textAlign: "left" }} />
                  <button style={s.copyBtn} onClick={() => copyToClipboard(results.resumeRewrite, "Rewrite copied!")}>
                    {copiedMsg === "Rewrite copied!" ? "Copied!" : "Copy to clipboard"}
                  </button>
                </div>
              </div>
            )}

            {/* Networking */}
            {activeTab === "network" && (
              <div className="fade-in">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
                  {(results.networkTargets || []).map((person, i) => (
                    <div key={i} className={`network-card${selectedNetworkIdx === i ? " selected" : ""}`} onClick={() => setSelectedNetworkIdx(i)} style={{ background: "#fff", border: "1.5px solid #e5e2db", borderRadius: "8px", padding: "16px" }}>
                      <div style={{ fontSize: "13px", color: "#1a1a2e", marginBottom: "6px", fontWeight: 600 }}>{person.title}</div>
                      <div style={{ fontSize: "12px", color: "#888", lineHeight: "1.5" }}>{person.reason}</div>
                      {selectedNetworkIdx === i && <div style={{ fontSize: "10px", color: "#1a1a2e", marginTop: "8px", letterSpacing: "1px", fontWeight: 600 }}>SELECTED ▼</div>}
                    </div>
                  ))}
                </div>
                {results.networkTargets?.[selectedNetworkIdx] && (
                  <div style={s.card}>
                    <div style={s.label}>LinkedIn Message → {results.networkTargets[selectedNetworkIdx].title}</div>
                    <div style={{ fontSize: "14px", lineHeight: "1.8", color: "#333", background: "#f8f7f4", borderRadius: "6px", padding: "16px", border: "1px solid #eee" }}>
                      {results.networkTargets[selectedNetworkIdx].message}
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "14px" }}>
                      <button style={s.copyBtn} onClick={() => copyToClipboard(results.networkTargets[selectedNetworkIdx].message, "Message copied!")}>
                        {copiedMsg === "Message copied!" ? "✓ Copied!" : "Copy message"}
                      </button>
                      <a href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(results.networkTargets[selectedNetworkIdx].title + " " + results.title.split(" at ").slice(1).join(" at "))}&origin=GLOBAL_SEARCH_HEADER`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#0077b5", color: "#fff", borderRadius: "6px", padding: "7px 14px", fontSize: "11px", fontFamily: "inherit", textDecoration: "none", letterSpacing: "0.5px", fontWeight: 600 }}>🔍 Search on LinkedIn</a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Plan */}
            {activeTab === "gaps" && (
              <div className="fade-in" style={s.card}>
                <div style={s.label}>How to Close Your Skill Gaps</div>
                <RenderMarkdown text={results.gapAdvice} style={{ fontSize: "14px", lineHeight: "1.9", color: "#333", whiteSpace: "pre-wrap" }} />
              </div>
            )}


            {/* Interview Prep */}
            {activeTab === "interview" && (
              <div className="fade-in">
                {(results.interviewQuestions || []).length === 0 ? (
                  <div style={{ ...s.card, textAlign: "center", padding: "40px", color: "#aaa", fontSize: "13px" }}>
                    No interview questions generated yet. Run the agent again to get interview prep!
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {(results.interviewQuestions || []).map((q, i) => (
                      <div key={i} style={{ ...s.card, padding: "20px 24px" }}>
                        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "12px" }}>
                          <span style={{ background: "#1a1a2e", color: "#fff", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0, marginTop: "2px" }}>{i + 1}</span>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a2e", lineHeight: "1.5" }}>{q.question}</div>
                        </div>
                        <div style={{ marginLeft: "36px", fontSize: "13px", color: "#555", lineHeight: "1.7", background: "#f8f7f4", borderRadius: "6px", padding: "12px 16px", borderLeft: "3px solid #1a1a2e" }}>
                          {q.answer}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Requirements */}
            {activeTab === "requirements" && (
              <div className="fade-in" style={s.card}>
                <div style={s.label}>All Requirements Extracted</div>
                {results.requirements.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "10px 0", borderBottom: i < results.requirements.length - 1 ? "1px solid #f0ede8" : "none" }}>
                    <span style={{ color: "#1a1a2e", fontSize: "11px", marginTop: "3px", minWidth: "20px", fontWeight: 600 }}>{String(i + 1).padStart(2, "0")}</span>
                    <span style={{ fontSize: "14px", color: "#333", lineHeight: "1.5" }}>{r}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: "24px", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#bbb" }}>
              <span style={{ color: "#16a34a" }}>●</span>
              Saved to tracker —
              <button onClick={() => setView("tracker")} style={{ background: "none", border: "none", color: "#888", fontFamily: "inherit", fontSize: "12px", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                view all applications
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

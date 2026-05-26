import { useState, useEffect, useRef } from "react";

const RESUME = `KAYLA C. EVANS
Kayla.c.evans@outlook.com | (760) 908 8347 | San Diego, CA

EDUCATION
UC San Diego, School of Global Policy and Strategy
MA in International Affairs, Specialty in International Management (GPA: 3.5) — June 2026
BA in International Business — June 2025
Relevant Coursework: International Business, Global Business Strategy, International Economics, Quantitative Methods I–II, Strategy & Negotiation, Product Marketing & Management

EXPERIENCE
UC San Diego – Rady School of Management
Teaching Assistant, Business & Organizational Leadership — June 2025–Present
• Managed grading workflows, academic records, and weekly deliverables for multiple course sections
• Coordinated with faculty on course materials, timelines, and office hours

SME Web Design
Marketing & Digital Strategy Intern — June 2025–Aug 2025
• Conducted market research, competitor analysis, and keyword research across client accounts
• Developed client website content and AI-powered chatbots using WordPress
• Created and scheduled LinkedIn posts, videos, and infographics
• Tracked tasks across multiple accounts using structured project workflows

Legal Aid Society of San Diego, Inc.
Clinic Volunteer — Sept 2024–Dec 2024
• Conducted client intake interviews; maintained case info in LegalServer
• Completed standardized court forms and eviction-related filings

UC San Diego – Parking and Transportation Services
Customer Service Representative — Sept 2023–July 2024
• Responded to 50+ daily inquiries; used ServiceNow and T2 to resolve issues

CoCo Rose Resort Wear
Sales Associate — April 2021–Aug 2024
• Supported POS transactions, inventory, and customer engagement

SKILLS
Microsoft Office, G-Suite, Canva, R Studio, WordPress, QGIS, Trello
Certifications: Real Estate Salesperson License, California
Languages: English (Native), Spanish (Intermediate)`;

const STEPS = [
  { id: "read",      label: "Reading job description",         icon: "📄" },
  { id: "analyze",   label: "Analyzing requirements",          icon: "🔍" },
  { id: "compare",   label: "Comparing to your resume",        icon: "⚖️" },
  { id: "cover",     label: "Writing cover letter",            icon: "✍️" },
  { id: "rewrite",   label: "Rewriting resume bullets",        icon: "🔄" },
  { id: "network",   label: "Finding networking targets",      icon: "🤝" },
  { id: "gaps",      label: "Building your action plan",       icon: "🎯" },
];

const TABS = [
  { id: "cover",     label: "Cover Letter" },
  { id: "rewrite",   label: "Resume Rewrite" },
  { id: "network",   label: "Networking" },
  { id: "gaps",      label: "Action Plan" },
  { id: "requirements", label: "Requirements" },
];

const STATUS_COLORS = {
  "Not Applied": "#555",
  "Applied":     "#5a9adb",
  "Interviewing":"#f0d080",
  "Offer":       "#5adb8a",
  "Rejected":    "#db5a5a",
};

export default function JobAgent() {
  const [jobText, setJobText]           = useState("");
  const [running, setRunning]           = useState(false);
  const [currentStep, setCurrentStep]   = useState(-1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [results, setResults]           = useState(null);
  const [activeTab, setActiveTab]       = useState("cover");
  const [error, setError]               = useState(null);
  const [dots, setDots]                 = useState("");
  const [view, setView]                 = useState("agent"); // "agent" | "tracker"
  const [applications, setApplications] = useState([]);
  const [copiedMsg, setCopiedMsg]       = useState("");
  const [selectedNetworkIdx, setSelectedNetworkIdx] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("jobAgentApps");
      if (saved) setApplications(JSON.parse(saved));
    } catch {}
  }, []);

  const saveApps = (apps) => {
    setApplications(apps);
    try { localStorage.setItem("jobAgentApps", JSON.stringify(apps)); } catch {}
  };

  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => setDots(d => d.length >= 3 ? "" : d + "."), 400);
    return () => clearInterval(iv);
  }, [running]);

  const callClaude = async (prompt) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
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

  const runAgent = async () => {
    if (!jobText.trim()) return;
    setRunning(true);
    setCompletedSteps([]);
    setCurrentStep(0);
    setResults(null);
    setError(null);
    setActiveTab("cover");
    setSelectedNetworkIdx(0);

    try {
      // Step 0: Read
      await new Promise(r => setTimeout(r, 800));
      setCompletedSteps(["read"]);
      setCurrentStep(1);

      // Step 1: Analyze
      await new Promise(r => setTimeout(r, 600));
      const reqRaw = await callClaude(
        `Extract the top 6-8 key requirements from this job posting as a JSON array of short strings. Return ONLY the JSON array, no markdown, no explanation:\n\n${jobText}`
      );
      let requirements = [];
      try { requirements = JSON.parse(reqRaw.replace(/```json|```/g,"").trim()); }
      catch { requirements = reqRaw.split("\n").filter(l=>l.trim()).slice(0,8); }
      setCompletedSteps(s=>[...s,"analyze"]);
      setCurrentStep(2);

      // Step 2: Compare
      await new Promise(r => setTimeout(r, 600));
      const matchRaw = await callClaude(
        `Given this resume:\n${RESUME}\n\nAnd these job requirements:\n${requirements.join("\n")}\n\nReturn a JSON object with two arrays: "matches" (requirements clearly met) and "gaps" (requirements missing or weak). Return ONLY the JSON object, no markdown.`
      );
      let matchData = { matches:[], gaps:[] };
      try { matchData = JSON.parse(matchRaw.replace(/```json|```/g,"").trim()); }
      catch { matchData = { matches: requirements.slice(0,4), gaps: requirements.slice(4) }; }
      setCompletedSteps(s=>[...s,"compare"]);
      setCurrentStep(3);

      // Step 3: Cover letter
      await new Promise(r => setTimeout(r, 600));
      const coverLetter = await callClaude(
        `Write a professional, tailored cover letter for Kayla Evans applying to this job:\n\n${jobText}\n\nHer resume:\n${RESUME}\n\nMake it compelling, specific, and under 300 words. No generic filler. Start with a strong opening line. Do not include a header/address block, just start with the letter body.`
      );
      setCompletedSteps(s=>[...s,"cover"]);
      setCurrentStep(4);

      // Step 4: Resume rewrite
      await new Promise(r => setTimeout(r, 600));
      const resumeRewrite = await callClaude(
        `Rewrite Kayla's resume bullet points to better match this job posting. Focus on the most relevant experience sections. Make bullets stronger, more quantified where possible, and keyword-optimized for this specific role. Return as plain text with section headers and bullet points using •. Keep it to the most relevant 3 experience sections.\n\nJob posting:\n${jobText}\n\nOriginal resume:\n${RESUME}`
      );
      setCompletedSteps(s=>[...s,"rewrite"]);
      setCurrentStep(5);

      // Step 5: Networking
      await new Promise(r => setTimeout(r, 600));
      const networkRaw = await callClaude(
        `Based on this job posting, suggest 4 types of people at this company that Kayla Evans should try to connect with on LinkedIn to strengthen her application. For each person, provide: a job title to search for, why they're worth connecting with, and a short personalized LinkedIn connection message (under 80 words) from Kayla. Return as a JSON array of objects with fields: "title", "reason", "message". Return ONLY the JSON array, no markdown.\n\nJob posting:\n${jobText}\n\nKayla's background:\n${RESUME}`
      );
      let networkTargets = [];
      try { networkTargets = JSON.parse(networkRaw.replace(/```json|```/g,"").trim()); }
      catch { networkTargets = [{ title:"Hiring Manager", reason:"Direct decision maker for this role", message:"Hi, I recently applied for this role and would love to connect and learn more about the team." }]; }
      setCompletedSteps(s=>[...s,"network"]);
      setCurrentStep(6);

      // Step 6: Gap advice
      await new Promise(r => setTimeout(r, 600));
      const gapAdvice = await callClaude(
        `Based on these skill gaps for a job application:\n${matchData.gaps.join("\n")}\n\nGive 4 specific, actionable tips for how Kayla Evans (recent grad, marketing/international affairs background) can address these gaps quickly. Be direct and practical. Format as a numbered list.`
      );
      setCompletedSteps(s=>[...s,"gaps"]);
      setCurrentStep(-1);

      // Extract title
      const titleRaw = await callClaude(
        `What is the job title and company name from this posting? Reply with ONLY: "Job Title at Company Name", nothing else.\n\n${jobText}`
      );
      const title = titleRaw.trim();

      const newResult = {
        title,
        requirements,
        matches: matchData.matches || [],
        gaps: matchData.gaps || [],
        coverLetter,
        resumeRewrite,
        networkTargets,
        gapAdvice,
        date: new Date().toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }),
        status: "Not Applied",
        id: Date.now(),
      };

      setResults(newResult);

      // Auto-add to tracker
      saveApps(prev => {
        const updated = [newResult, ...prev];
        return updated;
      });

    } catch (e) {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setRunning(false);
    }
  };

  const updateStatus = (id, status) => {
    saveApps(applications.map(a => a.id === id ? { ...a, status } : a));
  };

  const deleteApp = (id) => {
    saveApps(applications.filter(a => a.id !== id));
  };

  // ── STYLES ──────────────────────────────────────────────────────────────
  const s = {
    page: {
      minHeight: "100vh",
      background: "#080810",
      fontFamily: "'DM Mono', 'Courier New', monospace",
      color: "#e8e4d9",
    },
    header: {
      borderBottom: "1px solid #1a1a2a",
      padding: "22px 40px",
      display: "flex",
      alignItems: "center",
      gap: "0",
      background: "#0c0c18",
      justifyContent: "space-between",
    },
    logo: {
      fontFamily: "'Playfair Display', serif",
      fontSize: "26px",
      fontWeight: 900,
      color: "#f0d080",
      margin: 0,
      letterSpacing: "-0.5px",
    },
    nav: {
      display: "flex",
      gap: "4px",
    },
    navBtn: (active) => ({
      background: active ? "#1a1a2e" : "none",
      border: active ? "1px solid #2a2a4a" : "1px solid transparent",
      borderRadius: "6px",
      padding: "7px 16px",
      color: active ? "#f0d080" : "#555",
      fontFamily: "'DM Mono', monospace",
      fontSize: "11px",
      letterSpacing: "1.5px",
      textTransform: "uppercase",
      cursor: "pointer",
      transition: "all 0.2s",
    }),
    container: {
      maxWidth: "980px",
      margin: "0 auto",
      padding: "36px 24px",
    },
    label: {
      display: "block",
      fontSize: "10px",
      letterSpacing: "2px",
      textTransform: "uppercase",
      color: "#555",
      marginBottom: "10px",
    },
    card: {
      background: "#0c0c18",
      border: "1px solid #1a1a2a",
      borderRadius: "10px",
      padding: "24px",
    },
    tabBar: {
      display: "flex",
      borderBottom: "1px solid #1a1a2a",
      marginBottom: "24px",
      gap: 0,
      overflowX: "auto",
    },
    tabBtn: (active) => ({
      background: "none",
      border: "none",
      borderBottom: active ? "2px solid #f0d080" : "2px solid transparent",
      padding: "10px 18px",
      color: active ? "#f0d080" : "#555",
      fontFamily: "'DM Mono', monospace",
      fontSize: "11px",
      letterSpacing: "1.5px",
      textTransform: "uppercase",
      cursor: "pointer",
      whiteSpace: "nowrap",
      marginBottom: "-1px",
      transition: "all 0.2s",
    }),
    copyBtn: {
      background: "none",
      border: "1px solid #2a2a3e",
      borderRadius: "6px",
      padding: "7px 14px",
      color: "#8080aa",
      fontFamily: "'DM Mono', monospace",
      fontSize: "10px",
      cursor: "pointer",
      letterSpacing: "1px",
      marginTop: "16px",
      transition: "all 0.2s",
    },
    pill: (color) => ({
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: "20px",
      fontSize: "10px",
      letterSpacing: "1px",
      border: `1px solid ${color}`,
      color: color,
      background: color + "18",
    }),
  };

  // ── TRACKER VIEW ────────────────────────────────────────────────────────
  if (view === "tracker") {
    return (
      <div style={s.page}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Playfair+Display:wght@700;900&display=swap');
          * { box-sizing: border-box; }
          button { transition: all 0.2s; }
          button:hover { opacity: 0.85; }
          select { appearance: none; }
          .fade-in { animation: fadeIn 0.3s ease forwards; }
          @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        `}</style>
        <div style={s.header}>
          <h1 style={s.logo}>JobAgent</h1>
          <div style={s.nav}>
            <button style={s.navBtn(false)} onClick={()=>setView("agent")}>← Agent</button>
            <button style={s.navBtn(true)}>Tracker</button>
          </div>
        </div>
        <div style={s.container}>
          <div style={{ marginBottom: "28px" }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"22px", color:"#f0d080", fontWeight:700, marginBottom:"6px" }}>
              Application Tracker
            </div>
            <div style={{ fontSize:"12px", color:"#555" }}>
              {applications.length} application{applications.length !== 1 ? "s" : ""} saved
            </div>
          </div>

          {applications.length === 0 ? (
            <div style={{ ...s.card, textAlign:"center", padding:"60px 24px" }}>
              <div style={{ fontSize:"32px", marginBottom:"12px" }}>📋</div>
              <div style={{ color:"#555", fontSize:"13px" }}>No applications yet. Run the agent on a job posting to get started.</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              {applications.map((app, i) => (
                <div key={app.id} className="fade-in" style={{
                  ...s.card,
                  display:"flex",
                  alignItems:"center",
                  gap:"20px",
                  flexWrap:"wrap",
                }}>
                  <div style={{ flex: 1, minWidth:"200px" }}>
                    <div style={{ fontSize:"14px", color:"#e8e4d9", marginBottom:"4px", fontFamily:"'Playfair Display',serif" }}>
                      {app.title}
                    </div>
                    <div style={{ fontSize:"11px", color:"#444" }}>{app.date}</div>
                  </div>

                  <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                    <div style={{ fontSize:"11px", color:"#555", letterSpacing:"1px" }}>STATUS</div>
                    <select
                      value={app.status}
                      onChange={e => updateStatus(app.id, e.target.value)}
                      style={{
                        background:"#12121f",
                        border:"1px solid #2a2a3e",
                        borderRadius:"6px",
                        padding:"6px 12px",
                        color: STATUS_COLORS[app.status],
                        fontFamily:"'DM Mono',monospace",
                        fontSize:"11px",
                        cursor:"pointer",
                      }}
                    >
                      {Object.keys(STATUS_COLORS).map(s=>(
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display:"flex", gap:"8px" }}>
                    <button
                      onClick={() => { setResults(app); setView("agent"); setActiveTab("cover"); }}
                      style={{
                        background:"none",
                        border:"1px solid #2a2a3e",
                        borderRadius:"6px",
                        padding:"6px 12px",
                        color:"#8080aa",
                        fontFamily:"'DM Mono',monospace",
                        fontSize:"10px",
                        cursor:"pointer",
                        letterSpacing:"1px",
                      }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => deleteApp(app.id)}
                      style={{
                        background:"none",
                        border:"1px solid #3a1f1f",
                        borderRadius:"6px",
                        padding:"6px 12px",
                        color:"#884444",
                        fontFamily:"'DM Mono',monospace",
                        fontSize:"10px",
                        cursor:"pointer",
                        letterSpacing:"1px",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Status legend */}
          {applications.length > 0 && (
            <div style={{ marginTop:"28px", display:"flex", gap:"12px", flexWrap:"wrap" }}>
              {Object.entries(STATUS_COLORS).map(([label, color]) => (
                <span key={label} style={s.pill(color)}>{label}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── AGENT VIEW ──────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Playfair+Display:wght@700;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #080810; }
        ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 2px; }
        button { transition: all 0.2s; }
        textarea:focus { outline: none; border-color: #f0d080 !important; }
        .run-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(240,208,128,0.2); }
        .run-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .fade-in { animation: fadeIn 0.35s ease forwards; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .pulse { animation: pulse 1.4s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .network-card { cursor: pointer; transition: all 0.2s; }
        .network-card:hover { border-color: #3a3a5a !important; }
        .network-card.selected { border-color: #f0d080 !important; background: #14142a !important; }
      `}</style>

      <div style={s.header}>
        <div style={{ display:"flex", alignItems:"baseline", gap:"14px" }}>
          <h1 style={s.logo}>JobAgent</h1>
          <span style={{ fontSize:"10px", color:"#444", letterSpacing:"2px", textTransform:"uppercase" }}>
            autonomous application assistant
          </span>
        </div>
        <div style={s.nav}>
          <button style={s.navBtn(true)}>Agent</button>
          <button style={s.navBtn(false)} onClick={()=>setView("tracker")}>
            Tracker {applications.length > 0 && `(${applications.length})`}
          </button>
        </div>
      </div>

      <div style={s.container}>

        {/* Resume badge */}
        <div style={{
          display:"inline-flex", alignItems:"center", gap:"8px",
          background:"#0c0c18", border:"1px solid #1a1a2a",
          borderRadius:"6px", padding:"7px 14px", marginBottom:"24px",
          fontSize:"11px", color:"#666",
        }}>
          <span style={{ color:"#5adb8a", fontSize:"9px" }}>●</span>
          Resume loaded: <span style={{ color:"#e8e4d9" }}>Kayla C. Evans</span>
        </div>

        {/* Input */}
        <div style={{ marginBottom:"20px" }}>
          <label style={s.label}>Paste Job Description</label>
          <textarea
            value={jobText}
            onChange={e => setJobText(e.target.value)}
            disabled={running}
            placeholder="Paste the full job posting here — title, company, responsibilities, requirements..."
            rows={8}
            style={{
              width:"100%", background:"#0c0c18",
              border:"1px solid #1a1a2a", borderRadius:"8px",
              padding:"16px", color:"#e8e4d9",
              fontFamily:"'DM Mono',monospace", fontSize:"13px",
              lineHeight:"1.6", resize:"vertical", transition:"border-color 0.2s",
            }}
          />
        </div>

        <button
          className="run-btn"
          onClick={runAgent}
          disabled={running || !jobText.trim()}
          style={{
            background: running ? "#12121f" : "linear-gradient(135deg,#f0d080,#e8a840)",
            color: running ? "#555" : "#080810",
            border:"none", borderRadius:"8px",
            padding:"13px 30px", fontSize:"12px",
            fontFamily:"'DM Mono',monospace", fontWeight:"500",
            letterSpacing:"1.5px", cursor: running ? "not-allowed" : "pointer",
            marginBottom:"36px",
          }}
        >
          {running ? `Running agent${dots}` : "▶  Run Agent"}
        </button>

        {/* Progress */}
        {(running || results) && (
          <div style={{ ...s.card, marginBottom:"32px" }}>
            <div style={s.label}>Agent Progress</div>
            {STEPS.map((step, i) => {
              const done   = completedSteps.includes(step.id);
              const active = currentStep === i && running;
              return (
                <div key={step.id} style={{
                  display:"flex", alignItems:"center", gap:"12px",
                  padding:"9px 0",
                  borderBottom: i < STEPS.length-1 ? "1px solid #111120" : "none",
                  opacity: (!done && !active && running) ? 0.25 : 1,
                  transition:"opacity 0.3s",
                }}>
                  <span style={{ fontSize:"16px", width:"22px", textAlign:"center" }}>
                    {done ? "✅" : step.icon}
                  </span>
                  <span style={{
                    fontSize:"12px",
                    color: done ? "#5adb8a" : active ? "#f0d080" : "#555",
                    fontWeight: active ? "500" : "300",
                  }}>
                    {step.label}
                    {active && <span className="pulse" style={{ color:"#f0d080" }}>{dots}</span>}
                  </span>
                  {done && <span style={{ marginLeft:"auto", fontSize:"9px", color:"#2a2a4a", letterSpacing:"1px" }}>DONE</span>}
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <div style={{
            background:"#180f0f", border:"1px solid #4a1f1f",
            borderRadius:"8px", padding:"14px", color:"#ff8080",
            fontSize:"12px", marginBottom:"20px",
          }}>⚠ {error}</div>
        )}

        {/* Results */}
        {results && (
          <div className="fade-in">
            <div style={s.label}>Analysis complete</div>
            <h2 style={{
              fontFamily:"'Playfair Display',serif",
              fontSize:"22px", color:"#f0d080",
              margin:"0 0 24px", fontWeight:700,
            }}>{results.title}</h2>

            {/* Match / Gap cards */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px", marginBottom:"28px" }}>
              <div style={{ background:"#091409", border:"1px solid #162616", borderRadius:"8px", padding:"18px" }}>
                <div style={{ fontSize:"10px", letterSpacing:"2px", color:"#5adb8a", marginBottom:"12px", textTransform:"uppercase" }}>
                  ✓ Strong Matches
                </div>
                {results.matches.map((m,i) => (
                  <div key={i} style={{ fontSize:"12px", color:"#90c898", marginBottom:"6px", lineHeight:"1.5" }}>· {m}</div>
                ))}
              </div>
              <div style={{ background:"#180f09", border:"1px solid #2e1a0e", borderRadius:"8px", padding:"18px" }}>
                <div style={{ fontSize:"10px", letterSpacing:"2px", color:"#e89060", marginBottom:"12px", textTransform:"uppercase" }}>
                  ⚠ Skill Gaps
                </div>
                {results.gaps.map((g,i) => (
                  <div key={i} style={{ fontSize:"12px", color:"#b87850", marginBottom:"6px", lineHeight:"1.5" }}>· {g}</div>
                ))}
              </div>
            </div>

            {/* Tab bar */}
            <div style={s.tabBar}>
              {TABS.map(tab => (
                <button key={tab.id} style={s.tabBtn(activeTab===tab.id)} onClick={()=>setActiveTab(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Cover Letter ── */}
            {activeTab === "cover" && (
              <div className="fade-in" style={s.card}>
                <div style={s.label}>Tailored Cover Letter</div>
                <p style={{ fontSize:"13px", lineHeight:"1.9", color:"#c8c4b8", whiteSpace:"pre-wrap", margin:0 }}>
                  {results.coverLetter}
                </p>
                <button style={s.copyBtn} onClick={()=>copyToClipboard(results.coverLetter,"Cover letter copied!")}>
                  {copiedMsg === "Cover letter copied!" ? "✓ Copied!" : "Copy to clipboard"}
                </button>
              </div>
            )}

            {/* ── Resume Rewrite ── */}
            {activeTab === "rewrite" && (
              <div className="fade-in" style={s.card}>
                <div style={s.label}>Resume — Rewritten for This Role</div>
                <div style={{
                  fontSize:"11px", color:"#555", marginBottom:"16px",
                  padding:"10px 14px", background:"#0a0a14",
                  borderRadius:"6px", border:"1px solid #1a1a2a", lineHeight:"1.5",
                }}>
                  💡 These rewrites optimize your bullet points with keywords from the job description. Replace the relevant sections in your actual resume before applying.
                </div>
                <p style={{ fontSize:"13px", lineHeight:"1.9", color:"#c8c4b8", whiteSpace:"pre-wrap", margin:0 }}>
                  {results.resumeRewrite}
                </p>
                <button style={s.copyBtn} onClick={()=>copyToClipboard(results.resumeRewrite,"Resume rewrite copied!")}>
                  {copiedMsg === "Resume rewrite copied!" ? "✓ Copied!" : "Copy to clipboard"}
                </button>
              </div>
            )}

            {/* ── Networking ── */}
            {activeTab === "network" && (
              <div className="fade-in">
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px", marginBottom:"20px" }}>
                  {(results.networkTargets || []).map((person, i) => (
                    <div
                      key={i}
                      className={`network-card${selectedNetworkIdx===i?" selected":""}`}
                      onClick={()=>setSelectedNetworkIdx(i)}
                      style={{
                        background:"#0c0c18", border:"1px solid #1a1a2a",
                        borderRadius:"8px", padding:"16px",
                      }}
                    >
                      <div style={{ fontSize:"13px", color:"#f0d080", marginBottom:"6px", fontWeight:"500" }}>
                        {person.title}
                      </div>
                      <div style={{ fontSize:"11px", color:"#666", lineHeight:"1.5" }}>
                        {person.reason}
                      </div>
                      {selectedNetworkIdx===i && (
                        <div style={{ fontSize:"9px", color:"#f0d080", marginTop:"8px", letterSpacing:"1px" }}>
                          SELECTED ▼
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {results.networkTargets && results.networkTargets[selectedNetworkIdx] && (
                  <div style={s.card}>
                    <div style={s.label}>
                      LinkedIn Message → {results.networkTargets[selectedNetworkIdx].title}
                    </div>
                    <div style={{
                      fontSize:"13px", lineHeight:"1.8", color:"#c8c4b8",
                      background:"#0a0a14", borderRadius:"6px",
                      padding:"16px", border:"1px solid #1a1a2a",
                    }}>
                      {results.networkTargets[selectedNetworkIdx].message}
                    </div>
                    <div style={{ display:"flex", gap:"10px", alignItems:"center", marginTop:"14px" }}>
                      <button
                        style={s.copyBtn}
                        onClick={()=>copyToClipboard(results.networkTargets[selectedNetworkIdx].message, "Message copied!")}
                      >
                        {copiedMsg==="Message copied!" ? "✓ Copied!" : "Copy message"}
                      </button>
                      <span style={{ fontSize:"10px", color:"#3a3a4a" }}>
                        Search LinkedIn for "{results.networkTargets[selectedNetworkIdx].title}" + company name
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Action Plan ── */}
            {activeTab === "gaps" && (
              <div className="fade-in" style={s.card}>
                <div style={s.label}>How to Close Your Skill Gaps</div>
                <p style={{ fontSize:"13px", lineHeight:"1.9", color:"#c8c4b8", whiteSpace:"pre-wrap", margin:0 }}>
                  {results.gapAdvice}
                </p>
              </div>
            )}

            {/* ── Requirements ── */}
            {activeTab === "requirements" && (
              <div className="fade-in" style={s.card}>
                <div style={s.label}>All Requirements Extracted</div>
                {results.requirements.map((r,i) => (
                  <div key={i} style={{
                    display:"flex", gap:"14px", alignItems:"flex-start",
                    padding:"10px 0",
                    borderBottom: i<results.requirements.length-1 ? "1px solid #101018" : "none",
                  }}>
                    <span style={{ color:"#f0d080", fontSize:"10px", marginTop:"3px", minWidth:"20px" }}>
                      {String(i+1).padStart(2,"0")}
                    </span>
                    <span style={{ fontSize:"13px", color:"#c8c4b8", lineHeight:"1.5" }}>{r}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Saved badge */}
            <div style={{
              marginTop:"24px", display:"flex", alignItems:"center",
              gap:"10px", fontSize:"11px", color:"#444",
            }}>
              <span style={{ color:"#5adb8a" }}>●</span>
              Saved to tracker —
              <button
                onClick={()=>setView("tracker")}
                style={{ background:"none", border:"none", color:"#8080aa", fontFamily:"'DM Mono',monospace", fontSize:"11px", cursor:"pointer", padding:0, textDecoration:"underline" }}
              >
                view all applications
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

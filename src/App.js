import { useState, useEffect, useRef, useCallback } from "react";

// ─── THEME & CONSTANTS ────────────────────────────────────────────────────────
const THEME = {
  bg: "#050a0e",
  surface: "#0a1520",
  card: "#0d1e2e",
  border: "#1a3a5c",
  accent: "#00d4ff",
  accent2: "#00ff9d",
  accent3: "#ff6b35",
  text: "#e8f4f8",
  muted: "#6b8fa8",
  glow: "rgba(0,212,255,0.15)",
};

// ─── PARTICLE SYSTEM ──────────────────────────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particles = useRef([]);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // init particles
    const count = 80;
    particles.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const pts = particles.current;

      pts.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,212,255,${p.alpha})`;
        ctx.fill();
      });

      // connections
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(0,212,255,${0.12 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
        // mouse connections
        const dx = pts[i].x - mouse.current.x;
        const dy = pts[i].y - mouse.current.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 150) {
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(mouse.current.x, mouse.current.y);
          ctx.strokeStyle = `rgba(0,255,157,${0.25 * (1 - d / 150)})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0, left: 0,
        width: "100vw", height: "100vh",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

// ─── TYPEWRITER ───────────────────────────────────────────────────────────────
function TypeWriter({ strings, speed = 80, pause = 2000 }) {
  const [display, setDisplay] = useState("");
  const [idx, setIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = strings[idx % strings.length];
    let timer;
    if (!deleting && charIdx < current.length) {
      timer = setTimeout(() => setCharIdx((c) => c + 1), speed);
    } else if (!deleting && charIdx === current.length) {
      timer = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      timer = setTimeout(() => setCharIdx((c) => c - 1), speed / 2);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setIdx((i) => (i + 1) % strings.length);
    }
    setDisplay(current.slice(0, charIdx));
    return () => clearTimeout(timer);
  }, [charIdx, deleting, idx, strings, speed, pause]);

  return (
    <span style={{ color: THEME.accent }}>
      {display}
      <span style={{ animation: "blink 1s step-end infinite", color: THEME.accent2 }}>|</span>
    </span>
  );
}

// ─── PYTHON LIVE DEMO (uses Anthropic API) ────────────────────────────────────
function PythonDemo() {
  const [code, setCode] = useState(`# Live Python Execution via AI Backend\n# Try running some algorithms!\n\ndef fibonacci(n):\n    """Generate Fibonacci sequence up to n terms"""\n    seq = []\n    a, b = 0, 1\n    for _ in range(n):\n        seq.append(a)\n        a, b = b, a + b\n    return seq\n\nresult = fibonacci(10)\nprint(f"Fibonacci(10): {result}")\n\n# Sorting algorithm\ndef bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr\n\ndata = [64, 34, 25, 12, 22, 11, 90]\nprint(f"Sorted: {bubble_sort(data)}")`);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const runCode = async () => {
    setLoading(true);
    setError(false);
    setOutput("");
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a Python interpreter. When given Python code, execute it mentally and return ONLY the exact stdout output it would produce, nothing else. No explanations, no markdown, no code blocks. Just the raw output lines. If there's a syntax error or runtime error, return the error message as Python would print it.`,
          messages: [{ role: "user", content: `Execute this Python code and return ONLY the stdout output:\n\n${code}` }],
        }),
      });
      const data = await response.json();
      const text = data.content?.map((b) => b.text || "").join("") || "No output";
      setOutput(text.trim());
    } catch (e) {
      setError(true);
      setOutput("Error connecting to AI backend. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: "'Fira Code', 'Courier New', monospace" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 12,
      }}>
        <div style={{ display: "flex", gap: 8 }}>
          {["#ff5f57", "#ffbd2e", "#28c840"].map((c, i) => (
            <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
          ))}
          <span style={{ color: THEME.muted, fontSize: 13, marginLeft: 8 }}>python_demo.py</span>
        </div>
        <button
          onClick={runCode}
          disabled={loading}
          style={{
            background: loading ? THEME.border : `linear-gradient(135deg, ${THEME.accent2}, ${THEME.accent})`,
            border: "none",
            borderRadius: 6,
            padding: "6px 18px",
            color: "#000",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 13,
            letterSpacing: 1,
            transition: "all 0.2s",
          }}
        >
          {loading ? "▶ Running..." : "▶ Run Code"}
        </button>
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        style={{
          width: "100%",
          minHeight: 220,
          background: "#020c14",
          border: `1px solid ${THEME.border}`,
          borderRadius: 8,
          padding: 16,
          color: THEME.accent2,
          fontSize: 13,
          lineHeight: 1.7,
          resize: "vertical",
          outline: "none",
          boxSizing: "border-box",
          fontFamily: "inherit",
        }}
      />

      {(output || loading) && (
        <div style={{
          marginTop: 12,
          background: "#020c14",
          border: `1px solid ${error ? THEME.accent3 : THEME.accent2}`,
          borderRadius: 8,
          padding: 16,
          minHeight: 60,
        }}>
          <div style={{ color: THEME.muted, fontSize: 11, marginBottom: 8, letterSpacing: 2 }}>
            $ OUTPUT
          </div>
          {loading ? (
            <div style={{ color: THEME.accent, fontSize: 13 }}>
              <span style={{ animation: "pulse 1s infinite" }}>⚙ Executing via AI backend...</span>
            </div>
          ) : (
            <pre style={{
              color: error ? THEME.accent3 : THEME.accent2,
              fontSize: 13,
              margin: 0,
              whiteSpace: "pre-wrap",
              lineHeight: 1.7,
            }}>{output}</pre>
          )}
        </div>
      )}
      <p style={{ color: THEME.muted, fontSize: 12, marginTop: 8 }}>
        ✦ Edit the code above and click Run. Powered by Claude AI backend.
      </p>
    </div>
  );
}

// ─── AI CHAT (uses Anthropic API) ─────────────────────────────────────────────
function AIChat() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm Allen's AI assistant. Ask me anything about his skills, projects, or experience. I can help you decide if he's the right fit for your team! 🚀" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const ALLEN_CONTEXT = `You are an AI assistant embedded in Allen I. Mataga's developer portfolio. Your job is to answer questions about Allen professionally and enthusiastically. Here is Allen's profile:

Name: Allen I. Mataga
Role: Full Stack Developer / Odoo Developer
Location: Mandaluyong City, Philippines
Email: alleninocencion@gmail.com
Phone: +63 938 757 3907

Education:
- BS Computer Science, Concepcion Holy Cross College, Inc. (2021–2025) — Graduated with Internship Innovator Award
- Senior High School, Benigno S. Aquino National High School (2019–2021) — Graduated with Honors
- Junior High School, Benigno S. Aquino National High School (2015–2019)

Experience:
- Odoo Full Stack Developer at Toolkit Inc. (October 2025 – Present): specializes in Odoo HRIS/ERP customization, Python backend, user-friendly interfaces, secure solutions
- Intern at Tarlac II Electric Cooperative (2025): awarded Internship Innovator Award, handled IT support, system maintenance, troubleshooting
- Capstone Project (2024–2025): Web-based Barangay Management Information System for document requests and resident verification — features automatic document generation and email delivery, admin/super-admin security interface

Technical Skills: Odoo Development (HRIS & ERP Customization), Python, Full Stack Web Development (HTML, CSS, PHP), PostgreSQL & Database Management, API Integration & System Customization

Core Skills: Problem-Solving & Critical Thinking, Team Collaboration, Time Management & Adaptability

Languages: Filipino, English

Answer questions about Allen's background, skills, and fit for roles. Be helpful, enthusiastic, and professional. Keep answers concise (2-4 sentences max).`;

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const history = [...messages.filter(m => m.role !== "assistant" || messages.indexOf(m) > 0), userMsg]
        .map(m => ({ role: m.role, content: m.content }));
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: ALLEN_CONTEXT,
          messages: history,
        }),
      });
      const data = await response.json();
      const text = data.content?.map(b => b.text || "").join("") || "Sorry, I couldn't process that.";
      setMessages(m => [...m, { role: "assistant", content: text }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Connection error. Please try again!" }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: 380 }}>
      <div style={{
        flex: 1, overflowY: "auto", padding: "12px 0",
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: m.role === "user" ? "flex-end" : "flex-start",
          }}>
            <div style={{
              maxWidth: "80%",
              background: m.role === "user"
                ? `linear-gradient(135deg, ${THEME.accent}, ${THEME.accent2})`
                : THEME.surface,
              border: m.role === "assistant" ? `1px solid ${THEME.border}` : "none",
              borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              padding: "10px 14px",
              color: m.role === "user" ? "#000" : THEME.text,
              fontSize: 14,
              lineHeight: 1.6,
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 6, padding: "0 4px" }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: "50%",
                background: THEME.accent,
                animation: `bounce 1s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask about Allen's skills, experience..."
          style={{
            flex: 1,
            background: THEME.surface,
            border: `1px solid ${THEME.border}`,
            borderRadius: 24,
            padding: "10px 18px",
            color: THEME.text,
            fontSize: 14,
            outline: "none",
          }}
        />
        <button
          onClick={send}
          disabled={loading}
          style={{
            background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accent2})`,
            border: "none",
            borderRadius: 24,
            padding: "10px 20px",
            color: "#000",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

// ─── SKILL BAR ────────────────────────────────────────────────────────────────
function SkillBar({ name, level, color }) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setAnimated(true); observer.disconnect(); }
    }, { threshold: 0.2 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ color: THEME.text, fontSize: 14, fontWeight: 600 }}>{name}</span>
        <span style={{ color: color, fontSize: 13 }}>{level}%</span>
      </div>
      <div style={{
        height: 6, background: THEME.border, borderRadius: 3, overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: animated ? `${level}%` : "0%",
          background: `linear-gradient(90deg, ${color}, ${THEME.accent2})`,
          borderRadius: 3,
          transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: `0 0 10px ${color}`,
        }} />
      </div>
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
function Nav({ active, setActive }) {
  const links = ["home", "about", "skills", "projects", "python", "contact"];
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(5,10,14,0.95)" : "transparent",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom: scrolled ? `1px solid ${THEME.border}` : "none",
      transition: "all 0.4s ease",
      padding: "16px 40px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <div style={{
        fontFamily: "'Courier New', monospace",
        color: THEME.accent, fontWeight: 700, fontSize: 18, letterSpacing: 2,
      }}>
        AIM<span style={{ color: THEME.accent2 }}>_</span>
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {links.map(l => (
          <button
            key={l}
            onClick={() => {
              setActive(l);
              document.getElementById(l)?.scrollIntoView({ behavior: "smooth" });
            }}
            style={{
              background: active === l ? `rgba(0,212,255,0.1)` : "transparent",
              border: active === l ? `1px solid ${THEME.accent}` : "1px solid transparent",
              borderRadius: 6, padding: "6px 14px",
              color: active === l ? THEME.accent : THEME.muted,
              cursor: "pointer", fontSize: 13,
              textTransform: "uppercase", letterSpacing: 1,
              transition: "all 0.2s",
            }}
          >
            {l}
          </button>
        ))}
      </div>
    </nav>
  );
}

// ─── SECTION WRAPPER ──────────────────────────────────────────────────────────
function Section({ id, children, style = {} }) {
  return (
    <section id={id} style={{
      minHeight: "100vh",
      padding: id === "home" ? "0" : "120px 40px 100px",
      maxWidth: id === "home" ? "none" : 1100,
      margin: "0 auto",
      position: "relative",
      zIndex: 1,
      ...style,
    }}>
      {children}
    </section>
  );
}

// ─── CARD ─────────────────────────────────────────────────────────────────────
function Card({ children, glow = false, style = {} }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: THEME.card,
        border: `1px solid ${hovered ? THEME.accent : THEME.border}`,
        borderRadius: 16,
        padding: 32,
        transition: "all 0.3s ease",
        boxShadow: hovered
          ? `0 0 40px ${THEME.glow}, 0 8px 32px rgba(0,0,0,0.4)`
          : "0 4px 20px rgba(0,0,0,0.3)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── SECTION TITLE ────────────────────────────────────────────────────────────
function SectionTitle({ label, title, sub }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 60 }}>
      <div style={{
        display: "inline-block",
        background: `rgba(0,212,255,0.1)`,
        border: `1px solid ${THEME.accent}`,
        borderRadius: 20, padding: "4px 16px",
        color: THEME.accent, fontSize: 12, letterSpacing: 3,
        textTransform: "uppercase", marginBottom: 16,
      }}>{label}</div>
      <h2 style={{
        fontFamily: "'Georgia', serif",
        fontSize: "clamp(32px,5vw,52px)",
        color: THEME.text, margin: "0 0 16px",
        fontWeight: 400,
      }}>{title}</h2>
      {sub && <p style={{ color: THEME.muted, fontSize: 16, maxWidth: 500, margin: "0 auto" }}>{sub}</p>}
    </div>
  );
}

// ─── MAIN PORTFOLIO ───────────────────────────────────────────────────────────
export default function Portfolio() {
  const [active, setActive] = useState("home");

  // Always scroll to top on first load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home","about","skills","projects","python","contact"];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom >= 120) { setActive(id); break; }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div style={{
      background: THEME.bg,
      color: THEME.text,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      minHeight: "100vh",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&display=swap');
        html { scroll-behavior: auto; }
        html, body { height: 100%; margin: 0; padding: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${THEME.bg}; }
        ::-webkit-scrollbar-thumb { background: ${THEME.accent}; border-radius: 2px; }
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes bounce { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
        @keyframes float { 0%,100% { transform:translateY(0px); } 50% { transform:translateY(-12px); } }
        @keyframes glow-pulse { 0%,100% { box-shadow: 0 0 20px rgba(0,212,255,0.3); } 50% { box-shadow: 0 0 40px rgba(0,212,255,0.7); } }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scanline { 0% { top:-10%; } 100% { top:110%; } }
        textarea:focus { border-color: ${THEME.accent} !important; }
        input:focus { border-color: ${THEME.accent} !important; }
      `}</style>

      <ParticleField />
      <Nav active={active} setActive={setActive} />

      {/* ── HERO ── */}
      <Section id="home">
        <div style={{
          display: "flex", flexDirection: "column", justifyContent: "center",
          alignItems: "center", minHeight: "100vh", textAlign: "center",
          padding: "0 24px",
          animation: "fadeInUp 1s ease forwards",
        }}>
          {/* ring decoration */}
          <div style={{
            position: "relative", marginBottom: 40,
            animation: "float 4s ease-in-out infinite",
          }}>
            <div style={{
              width: 140, height: 140, borderRadius: "50%",
              border: `2px solid ${THEME.accent}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "glow-pulse 3s ease-in-out infinite",
              position: "relative",
            }}>
              <div style={{
                width: 120, height: 120, borderRadius: "50%",
                background: `linear-gradient(135deg, ${THEME.surface}, ${THEME.card})`,
                border: `1px solid ${THEME.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 48,
              }}>
                👨‍💻
              </div>
              {/* orbiting dot */}
              <div style={{
                position: "absolute", top: -6, left: "50%",
                width: 12, height: 12, borderRadius: "50%",
                background: THEME.accent2,
                boxShadow: `0 0 12px ${THEME.accent2}`,
                transformOrigin: "50% 76px",
                animation: "rotate 4s linear infinite",
              }} />
            </div>
          </div>

          <div style={{
            fontSize: 13, letterSpacing: 4, color: THEME.accent,
            textTransform: "uppercase", marginBottom: 16,
            fontFamily: "'Fira Code', monospace",
          }}>
            &lt;hello world /&gt;
          </div>

          <h1 style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: "clamp(40px,8vw,80px)",
            fontWeight: 400, lineHeight: 1.1,
            marginBottom: 16, letterSpacing: -1,
          }}>
            Allen I. <span style={{
              background: `linear-gradient(90deg, ${THEME.accent}, ${THEME.accent2})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Mataga</span>
          </h1>

          <div style={{ fontSize: "clamp(18px,3vw,26px)", marginBottom: 32, height: 40 }}>
            <TypeWriter strings={[
              "Full Stack Developer",
              "Odoo ERP Specialist",
              "Python Backend Engineer",
              "Problem Solver",
            ]} />
          </div>

          <p style={{
            color: THEME.muted, fontSize: 17, maxWidth: 560,
            lineHeight: 1.8, marginBottom: 48,
          }}>
            Building efficient, secure, and user-friendly applications. CS graduate from Concepcion Holy Cross College — Internship Innovator Awardee.
          </p>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <a
              href="mailto:alleninocencion@gmail.com"
              style={{
                background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accent2})`,
                color: "#000", fontWeight: 700, fontSize: 15,
                padding: "14px 32px", borderRadius: 40, textDecoration: "none",
                letterSpacing: 1, transition: "transform 0.2s",
              }}
              onMouseOver={e => e.target.style.transform = "scale(1.05)"}
              onMouseOut={e => e.target.style.transform = "scale(1)"}
            >
              Hire Me
            </a>
            <a
              href="https://drive.google.com/file/d/1MnbPVLmhpBCnEuLbdAVEikUcpOuEJk1L/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "transparent",
                color: THEME.accent, fontWeight: 700, fontSize: 15,
                padding: "14px 32px", borderRadius: 40, textDecoration: "none",
                border: `2px solid ${THEME.accent}`, letterSpacing: 1,
                transition: "all 0.2s",
              }}
              onMouseOver={e => { e.target.style.background = `rgba(0,212,255,0.1)`; }}
              onMouseOut={e => { e.target.style.background = "transparent"; }}
            >
              ↓ Download CV
            </a>
          </div>

          {/* scroll indicator */}
          <div style={{
            position: "absolute", bottom: 40,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            color: THEME.muted, fontSize: 12, letterSpacing: 2,
            animation: "float 2s ease-in-out infinite",
          }}>
            <span>SCROLL</span>
            <div style={{
              width: 1, height: 40, background: `linear-gradient(${THEME.accent}, transparent)`,
            }} />
          </div>
        </div>
      </Section>

      {/* ── ABOUT ── */}
      <Section id="about">
        <SectionTitle
          label="01 / About"
          title="Who I Am"
          sub="A passionate developer crafting digital solutions from the Philippines"
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <Card>
            <div style={{
              fontSize: 13, color: THEME.accent, letterSpacing: 2,
              fontFamily: "'Fira Code', monospace", marginBottom: 16,
            }}>// profile.json</div>
            <pre style={{
              color: THEME.text, fontSize: 14, lineHeight: 1.9,
              fontFamily: "'Fira Code', monospace", whiteSpace: "pre-wrap",
            }}>{`{
  "name": "Allen I. Mataga",
  "role": "Full Stack Developer",
  "location": "Mandaluyong, PH",
  "education": "BS Computer Science",
  "school": "CHCC, Inc.",
  "year_graduated": 2025,
  "award": "Internship Innovator",
  "current_role": "Odoo Developer",
  "company": "Toolkit Inc.",
  "languages": ["Filipino", "English"],
  "open_to_work": true
}`}</pre>
          </Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              { icon: "🎓", label: "Education", value: "BS Computer Science — CHCC Inc., Graduated 2025 with Honors" },
              { icon: "💼", label: "Current Role", value: "Odoo Full Stack Developer at Toolkit Inc. (Oct 2025 – Present)" },
              { icon: "🏆", label: "Award", value: "Internship Innovator Award — recognized for impactful work at TARELCO II" },
              { icon: "📍", label: "Location", value: "869 Katarungan St., Plainview, Mandaluyong City, 1550" },
            ].map((item, i) => (
              <Card key={i} style={{ padding: 20, display: "flex", gap: 16, alignItems: "flex-start" }}>
                <span style={{ fontSize: 28 }}>{item.icon}</span>
                <div>
                  <div style={{ color: THEME.accent, fontSize: 12, letterSpacing: 2, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ color: THEME.text, fontSize: 14, lineHeight: 1.6 }}>{item.value}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* ── SKILLS ── */}
      <Section id="skills">
        <SectionTitle label="02 / Skills" title="Technical Arsenal" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <Card>
            <h3 style={{ color: THEME.accent2, marginBottom: 28, fontSize: 16, letterSpacing: 2, textTransform: "uppercase" }}>
              Technical Skills
            </h3>
            {[
              { name: "Python Development", level: 85, color: THEME.accent },
              { name: "Odoo ERP / HRIS", level: 88, color: THEME.accent2 },
              { name: "HTML / CSS / PHP", level: 82, color: THEME.accent3 },
              { name: "PostgreSQL", level: 78, color: THEME.accent },
              { name: "API Integration", level: 80, color: THEME.accent2 },
              { name: "Full Stack Dev", level: 83, color: THEME.accent3 },
            ].map(s => <SkillBar key={s.name} {...s} />)}
          </Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card style={{ padding: 28 }}>
              <h3 style={{ color: THEME.accent2, marginBottom: 20, fontSize: 16, letterSpacing: 2, textTransform: "uppercase" }}>
                Core Strengths
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {[
                  "Problem Solving", "Critical Thinking", "Team Collaboration",
                  "Time Management", "Adaptability", "System Design",
                  "Backend Logic", "Database Design", "IoT Development",
                  "Mobile Development",
                ].map(tag => (
                  <span key={tag} style={{
                    background: `rgba(0,212,255,0.08)`,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 20, padding: "6px 14px",
                    color: THEME.text, fontSize: 13,
                    transition: "all 0.2s",
                    cursor: "default",
                  }}
                    onMouseOver={e => {
                      e.target.style.borderColor = THEME.accent;
                      e.target.style.color = THEME.accent;
                    }}
                    onMouseOut={e => {
                      e.target.style.borderColor = THEME.border;
                      e.target.style.color = THEME.text;
                    }}
                  >{tag}</span>
                ))}
              </div>
            </Card>
            <Card style={{ padding: 28 }}>
              <h3 style={{ color: THEME.accent2, marginBottom: 20, fontSize: 16, letterSpacing: 2, textTransform: "uppercase" }}>
                Tech Stack
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { name: "Python", icon: "🐍" },
                  { name: "Odoo", icon: "⚙️" },
                  { name: "PostgreSQL", icon: "🐘" },
                  { name: "PHP", icon: "🐘" },
                  { name: "HTML/CSS", icon: "🎨" },
                  { name: "XML", icon: "📄" },
                ].map(tech => (
                  <div key={tech.name} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: THEME.surface, borderRadius: 10, padding: "10px 14px",
                    border: `1px solid ${THEME.border}`,
                  }}>
                    <span style={{ fontSize: 20 }}>{tech.icon}</span>
                    <span style={{ color: THEME.text, fontSize: 14 }}>{tech.name}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </Section>

      {/* ── PROJECTS ── */}
      <Section id="projects">
        <SectionTitle label="03 / Projects" title="Work & Projects" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 28 }}>
          {[
            {
              title: "Odoo HRIS/ERP Customization",
              company: "Toolkit Inc. · Oct 2025 – Present",
              desc: "Specialized in developing and customizing Odoo HRIS modules for workforce management. Built robust backend logic with Python and integrated user-friendly ERP interfaces.",
              tags: ["Python", "Odoo", "PostgreSQL", "ERP", "HRIS"],
              color: THEME.accent,
              icon: "⚙️",
              status: "Live",
            },
            {
              title: "Barangay Management Information System",
              company: "Capstone Project · 2024–2025",
              desc: "Web-based system for online document requests from barangay offices — auto-generates soft copies and emails them to residents. Features admin and super-admin panels for security.",
              tags: ["PHP", "HTML", "CSS", "PostgreSQL", "Email API"],
              color: THEME.accent2,
              icon: "🏛️",
              status: "Completed",
            },
            {
              title: "IT Systems & Infrastructure",
              company: "TARELCO II Internship · 2025",
              desc: "Provided IT support and system maintenance for Tarlac II Electric Cooperative. Awarded Internship Innovator Award for initiative and impactful technical contributions.",
              tags: ["System Maintenance", "Networking", "Troubleshooting"],
              color: THEME.accent3,
              icon: "🔧",
              status: "Award Won",
            },
          ].map((p, i) => (
            <Card key={i} style={{ position: "relative", overflow: "hidden" }}>
              {/* top accent line */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, ${p.color}, transparent)`,
              }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <span style={{ fontSize: 36 }}>{p.icon}</span>
                <span style={{
                  background: `rgba(0,0,0,0.4)`,
                  border: `1px solid ${p.color}`,
                  borderRadius: 12, padding: "3px 10px",
                  color: p.color, fontSize: 11, letterSpacing: 1,
                }}>{p.status}</span>
              </div>
              <h3 style={{ color: THEME.text, fontSize: 18, marginBottom: 6, fontWeight: 600 }}>{p.title}</h3>
              <div style={{ color: p.color, fontSize: 12, letterSpacing: 1, marginBottom: 14 }}>{p.company}</div>
              <p style={{ color: THEME.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>{p.desc}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {p.tags.map(t => (
                  <span key={t} style={{
                    background: `rgba(0,0,0,0.3)`,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 4, padding: "3px 8px",
                    color: THEME.muted, fontSize: 12,
                    fontFamily: "'Fira Code', monospace",
                  }}>{t}</span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* ── PYTHON LIVE DEMO ── */}
      <Section id="python">
        <SectionTitle
          label="04 / Python Lab"
          title="Live Python Playground"
          sub="Edit and run Python code live — powered by AI backend"
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <Card>
            <div style={{ color: THEME.accent2, fontSize: 13, letterSpacing: 2, marginBottom: 20, textTransform: "uppercase" }}>
              ⚡ Interactive Code Runner
            </div>
            <PythonDemo />
          </Card>
          <Card>
            <div style={{ color: THEME.accent2, fontSize: 13, letterSpacing: 2, marginBottom: 20, textTransform: "uppercase" }}>
              🤖 Ask About Allen
            </div>
            <AIChat />
          </Card>
        </div>
      </Section>

      {/* ── CONTACT ── */}
      <Section id="contact">
        <SectionTitle label="05 / Contact" title="Let's Build Together" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 60 }}>
          {[
            { icon: "✉️", label: "Email", value: "alleninocencion@gmail.com", href: "mailto:alleninocencion@gmail.com" },
            { icon: "📱", label: "Phone", value: "+63 938 757 3907", href: "tel:+639387573907" },
            { icon: "📍", label: "Location", value: "Mandaluyong City, Philippines", href: "#" },
            { icon: "💼", label: "Resume", value: "Download CV / Resume", href: "https://drive.google.com/file/d/1MnbPVLmhpBCnEuLbdAVEikUcpOuEJk1L/view?usp=sharing" },
          ].map((c, i) => (
            <a key={i} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
              style={{ textDecoration: "none" }}>
              <Card style={{ display: "flex", gap: 18, alignItems: "center", padding: 24 }}>
                <span style={{ fontSize: 32 }}>{c.icon}</span>
                <div>
                  <div style={{ color: THEME.muted, fontSize: 12, letterSpacing: 2, marginBottom: 4 }}>{c.label}</div>
                  <div style={{ color: THEME.text, fontSize: 15 }}>{c.value}</div>
                </div>
              </Card>
            </a>
          ))}
        </div>

        {/* References */}
        <SectionTitle label="References" title="References" sub="Available upon request" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {[
            {
              name: "Jayvee Alborote",
              role: "System Development & Technical Head",
              company: "TARELCO II",
              phone: "+63 919 091 7973",
              email: "jayvee.alborote@tarelco2.com",
            },
            {
              name: "Patrick Jason Torres",
              role: "IT Specialist / College Professor",
              company: "Concepcion Holy Cross College",
              phone: "+63 915 884 8515",
              email: "torrespatrickjason@chcc.edu.ph",
            },
          ].map((r, i) => (
            <Card key={i}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>👤</div>
              <h3 style={{ color: THEME.accent, fontSize: 18, marginBottom: 4 }}>{r.name}</h3>
              <div style={{ color: THEME.muted, fontSize: 13, marginBottom: 2 }}>{r.role}</div>
              <div style={{ color: THEME.accent2, fontSize: 12, marginBottom: 16 }}>{r.company}</div>
              <div style={{ color: THEME.text, fontSize: 13, marginBottom: 4 }}>📞 {r.phone}</div>
              <div style={{ color: THEME.text, fontSize: 13 }}>✉️ {r.email}</div>
            </Card>
          ))}
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: `1px solid ${THEME.border}`,
        padding: "32px 40px",
        textAlign: "center",
        color: THEME.muted, fontSize: 14,
        position: "relative", zIndex: 1,
      }}>
        <div style={{ marginBottom: 8 }}>
          Built with <span style={{ color: THEME.accent }}>React</span> · Designed & Developed by{" "}
          <span style={{ color: THEME.accent2 }}>Allen I. Mataga</span>
        </div>
        <div style={{ fontSize: 12 }}>© 2025 Allen I. Mataga — All Rights Reserved</div>
      </footer>
    </div>
  );
}

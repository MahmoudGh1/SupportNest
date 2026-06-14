"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/* ─── theme ──────────────────────────────────────────────────────────────── */
const T = {
  bg: "#ffffff",
  bgSection: "#f6f5fc",
  text: "#1a1830",
  textMid: "#3d3a55",
  textBody: "#64607a",
  textHint: "#AFA9EC",
  border: "#e8e6f0",
  borderMid: "#d4d0e8",
  purple: "#534AB7",
  purpleLight: "#7F77DD",
  purpleFaint: "#EEEDFE",
  purpleTint: "rgba(83,74,183,0.08)",
  purpleRing: "rgba(83,74,183,0.18)",
  green: "#1D9E75",
  greenFaint: "#E1F5EE",
  greenTint: "rgba(29,158,117,0.08)",
  greenRing: "rgba(29,158,117,0.18)",
  amber: "#D97706",
  amberFaint: "#FEF3C7",
  amberTint: "rgba(217,119,6,0.07)",
  amberRing: "rgba(217,119,6,0.15)",
  red: "#E24B4A",
  redFaint: "#FEECEC",
  redTint: "rgba(226,75,74,0.07)",
} as const;

/* ─── types ─────────────────────────────────────────────────────────────── */
type StepKind =
  | { kind: "arrive"; to: 0 | 1 | 2; msg: string }
  | { kind: "solve"; at: 0 | 1 | 2; msg: string }
  | { kind: "fail"; at: 0 | 1 | 2; msg: string };

interface Scenario {
  id: string;
  icon: string;
  label: string;
  tag: string;
  steps: StepKind[];
}

type AgentState = "idle" | "active" | "success" | "fail";

/* ─── data ──────────────────────────────────────────────────────────────── */
const SCENARIOS: Scenario[] = [
  {
    id: "password",
    icon: "🔑",
    label: "Password reset",
    tag: "Simple",
    steps: [
      { kind: "arrive", to: 0, msg: "Incoming: password reset request" },
      { kind: "solve", at: 0, msg: "Tier 1 resolved it — reset link sent instantly" },
    ],
  },
  {
    id: "integration",
    icon: "⚙️",
    label: "Integration error",
    tag: "Medium",
    steps: [
      { kind: "arrive", to: 0, msg: "Incoming: webhook integration failure" },
      { kind: "fail", at: 0, msg: "Outside Tier 1 scope — escalating to Tier 2" },
      { kind: "arrive", to: 1, msg: "Tier 2 analysing error logs and stack trace" },
      { kind: "solve", at: 1, msg: "Tier 2 pinpointed the root cause — patch applied" },
    ],
  },
  {
    id: "dataloss",
    icon: "🚨",
    label: "Critical data loss",
    tag: "Critical",
    steps: [
      { kind: "arrive", to: 0, msg: "Incoming: critical data integrity alert" },
      { kind: "fail", at: 0, msg: "Severity too high for Tier 1 — escalating" },
      { kind: "arrive", to: 1, msg: "Tier 2 running diagnostics on affected tables" },
      { kind: "fail", at: 1, msg: "Requires human judgement — escalating to agent" },
      { kind: "arrive", to: 2, msg: "Human agent reviewing full incident context" },
      { kind: "solve", at: 2, msg: "Human agent resolved with tailored response" },
    ],
  },
];

const AGENTS = [
  {
    tier: "Tier 1",
    name: "AI Responder",
    desc: "Handles common, repetitive queries instantly using your knowledge base.",
    accent: T.purple,
    bgLight: T.purpleTint,
    ring: T.purpleRing,
    faint: T.purpleFaint,
    emoji: "🤖",
  },
  {
    tier: "Tier 2",
    name: "AI Analyst",
    desc: "Multi-step reasoning for technical issues and edge cases.",
    accent: T.green,
    bgLight: T.greenTint,
    ring: T.greenRing,
    faint: T.greenFaint,
    emoji: "🧠",
  },
  {
    tier: "Human",
    name: "Support Agent",
    desc: "Complex, sensitive, or escalated issues requiring empathy and judgement.",
    accent: T.amber,
    bgLight: T.amberTint,
    ring: T.amberRing,
    faint: T.amberFaint,
    emoji: "👩‍💼",
  },
];

const CYCLE_MS = 5_000;
const STEP_MS = 1_600;
const PAUSE_MS = 900;

function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms));
}

/* ─── AgentCard ─────────────────────────────────────────────────────────── */
function AgentCard({
  index,
  state,
  problemHere,
}: {
  index: number;
  state: AgentState;
  problemHere: boolean;
}) {
  const a = AGENTS[index];

  const borderColor =
    state === "success" ? T.green
      : state === "fail" ? T.red
        : state === "active" ? a.accent
          : T.border;

  const bgColor =
    state === "success" ? T.greenTint
      : state === "fail" ? T.redTint
        : state === "active" ? a.bgLight
          : T.bg;

  const shadowColor =
    state === "success" ? T.greenRing
      : state === "fail" ? "rgba(226,75,74,0.12)"
        : state === "active" ? a.ring
          : "transparent";

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: bgColor,
        border: `1.5px solid ${borderColor}`,
        borderRadius: 20,
        padding: "28px 20px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        position: "relative",
        transition: "border-color 0.35s ease, background 0.35s ease, box-shadow 0.35s ease",
        boxShadow: state !== "idle" ? `0 4px 24px ${shadowColor}` : "0 1px 4px rgba(83,74,183,0.04)",
      }}
    >
      {/* pulse dot */}
      {problemHere && (
        <span style={{
          position: "absolute", top: 12, right: 14,
          width: 8, height: 8, borderRadius: "50%",
          background: a.accent,
          boxShadow: `0 0 0 3px ${a.faint}`,
          animation: "pulseDot 1.2s ease-in-out infinite",
        }} />
      )}

      {/* status badge */}
      {(state === "success" || state === "fail") && (
        <span style={{ position: "absolute", top: 12, left: 14, fontSize: 14 }}>
          {state === "success" ? "✅" : "❌"}
        </span>
      )}

      {/* avatar */}
      <div style={{
        width: 60, height: 60, borderRadius: "50%",
        background: state !== "idle" ? a.bgLight : T.purpleFaint,
        border: `2px solid ${state !== "idle" ? a.accent : T.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 26,
        transition: "border-color 0.3s, transform 0.3s",
        transform: state === "active" ? "scale(1.08)" : "scale(1)",
      }}>
        {a.emoji}
      </div>

      {/* tier badge */}
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: a.accent,
        background: a.faint,
        border: `1px solid ${a.accent}30`,
        borderRadius: 20,
        padding: "2px 10px",
      }}>
        {a.tier}
      </span>

      <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: 0, textAlign: "center" }}>
        {a.name}
      </p>
      <p style={{ fontSize: 12, color: T.textBody, margin: 0, textAlign: "center", lineHeight: 1.55 }}>
        {a.desc}
      </p>
    </div>
  );
}

/* ─── Connector ─────────────────────────────────────────────────────────── */
function Connector({ active }: { active: boolean }) {
  return (
    <div style={{
      flexShrink: 0, width: 32,
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative",
    }}>
      <div style={{
        width: "100%", height: 1.5,
        background: active
          ? `linear-gradient(90deg, ${T.purple}80, ${T.green}80)`
          : T.border,
        transition: "background 0.4s",
      }} />
      <svg width="7" height="11" viewBox="0 0 7 11"
        style={{ position: "absolute", right: -1 }}>
        <path d="M1 1l5 4.5L1 10"
          stroke={active ? T.green : T.borderMid}
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );
}

/* ─── main ──────────────────────────────────────────────────────────────── */
export default function AgentPipelineSection() {
  const [agentStates, setAgentStates] = useState<AgentState[]>(["idle", "idle", "idle"]);
  const [activeProbAt, setActiveProbAt] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState("Watch how every ticket finds the right agent.");
  const [statusKind, setStatusKind] = useState<"default" | "success" | "fail" | "active">("default");
  const [countdown, setCountdown] = useState(CYCLE_MS / 1000);
  const [activePill, setActivePill] = useState(0);

  const runningRef = useRef(false);
  const mountedRef = useRef(true);
  const timerRef = useRef<number | null>(null);
  const cdRef = useRef<number | null>(null);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const reset = useCallback(() => {
    setAgentStates(["idle", "idle", "idle"]);
    setActiveProbAt(null);
    setStatusMsg("Watch how every ticket finds the right agent.");
    setStatusKind("default");
  }, []);

  const runScenario = useCallback(async (idx: number) => {
    if (!mountedRef.current) return;
    runningRef.current = true;
    const s = SCENARIOS[idx % SCENARIOS.length];
    setActivePill(idx % SCENARIOS.length);
    const states: AgentState[] = ["idle", "idle", "idle"];

    for (const step of s.steps) {
      if (!mountedRef.current) return;
      if (step.kind === "arrive") {
        states[step.to] = "active";
        setAgentStates([...states]);
        setActiveProbAt(step.to);
        setStatusMsg(step.msg); setStatusKind("active");
        await sleep(STEP_MS);
      } else if (step.kind === "solve") {
        states[step.at] = "success";
        setAgentStates([...states]);
        setActiveProbAt(null);
        setStatusMsg(step.msg); setStatusKind("success");
        await sleep(STEP_MS + PAUSE_MS);
      } else if (step.kind === "fail") {
        states[step.at] = "fail";
        setAgentStates([...states]);
        setStatusMsg(step.msg); setStatusKind("fail");
        await sleep(STEP_MS);
      }
    }
    runningRef.current = false;
  }, []);

  const startCycleRef = useRef<(idx: number) => void>(() => { });

  const startCycle = useCallback((idx: number) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (cdRef.current) window.clearInterval(cdRef.current);
    reset();

    window.setTimeout(async () => {
      await runScenario(idx);
      if (!mountedRef.current) return;
      let rem = CYCLE_MS / 1000;
      setCountdown(rem);

      cdRef.current = window.setInterval(() => {
        rem--;
        if (!mountedRef.current) return;
        setCountdown(Math.max(0, rem));
        if (rem <= 0 && cdRef.current) window.clearInterval(cdRef.current);
      }, 1000);

      timerRef.current = window.setTimeout(() => {
        if (!mountedRef.current) return;
        // 2. Call it via the ref to bypass the TDZ declaration error!
        startCycleRef.current(idx + 1);
      }, CYCLE_MS);
    }, 300);
  }, [reset, runScenario]);

  // 3. Keep the ref updated with the latest memoized function instance
  useEffect(() => {
    startCycleRef.current = startCycle;
  }, [startCycle]);

  // 4. Kick off the initialization loop safely
  useEffect(() => {
    // Delay the initial execution by 1 frame to prevent cascading synchronous renders
    const initTimeout = window.setTimeout(() => {
      startCycle(0);
    }, 0);

    return () => {
      window.clearTimeout(initTimeout); // Clean up the init hook if unmounted instantly
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (cdRef.current) window.clearInterval(cdRef.current);
    };
  }, [startCycle]);

  const statusColor =
    statusKind === "success" ? T.green
      : statusKind === "fail" ? T.red
        : statusKind === "active" ? T.purple
          : T.textHint;

  const PILL_COLORS = [T.purple, T.green, T.red];

  return (
    <section
      id="pipeline"
      style={{
        background: T.bgSection,
        padding: "96px 5% 100px",
        fontFamily: "'Inter', system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes pulseDot {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.5; transform:scale(1.6); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes tickerIn {
          from { opacity:0; transform:translateY(5px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      {/* Lavender radial glow — matches hero section */}
      <div style={{ position: "absolute", top: -180, left: "50%", transform: "translateX(-50%)", width: 700, height: 480, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(83,74,183,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -100, right: "4%", width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(29,158,117,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1040, margin: "0 auto" }}>

        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: 52, animation: "fadeUp 0.6s ease both" }}>
          <div style={{
            display: "inline-block",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: T.purple,
            background: T.purpleFaint,
            border: `1px solid ${T.purple}28`,
            borderRadius: 20, padding: "4px 14px", marginBottom: 20,
          }}>
            How it works
          </div>
          <h2 style={{
            fontSize: "clamp(1.9rem,3.8vw,2.7rem)",
            fontWeight: 800, color: T.text,
            letterSpacing: "-0.03em", margin: "0 0 14px", lineHeight: 1.15,
          }}>
            The intelligent support pipeline
          </h2>
          <p style={{ fontSize: 16, color: T.textBody, maxWidth: 480, margin: "0 auto", lineHeight: 1.75 }}>
            80% of tickets never reach a human. Every escalation arrives with full context — no cold starts.
          </p>
        </div>

        {/* Scenario pills */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 40, flexWrap: "wrap" }}>
          {SCENARIOS.map((sc, i) => {
            const isActive = activePill === i;
            const c = PILL_COLORS[i];
            return (
              <button
                key={sc.id}
                onClick={() => {
                  if (runningRef.current) return;

                  window.clearTimeout(timerRef.current || undefined);
                  window.clearInterval(cdRef.current || undefined);

                  reset();
                  setTimeout(() => startCycle(i), 80);
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "7px 16px", borderRadius: 30,
                  border: `1.5px solid ${isActive ? c : T.border}`,
                  background: isActive ? `${c}10` : T.bg,
                  color: isActive ? c : T.textBody,
                  fontSize: 13, fontWeight: 500,
                  cursor: "pointer", transition: "all 0.2s",
                  fontFamily: "inherit",
                  boxShadow: isActive ? `0 2px 10px ${c}20` : "none",
                }}
              >
                <span>{sc.icon}</span>
                <span>{sc.label}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
                  textTransform: "uppercase", borderRadius: 10, padding: "1px 7px",
                  background: isActive ? `${c}18` : T.purpleFaint,
                  color: isActive ? c : T.textHint,
                }}>
                  {sc.tag}
                </span>
              </button>
            );
          })}
        </div>

        {/* Agent cards */}
        <div style={{ display: "flex", alignItems: "stretch", gap: 0, marginBottom: 20 }}>
          <AgentCard index={0} state={agentStates[0]} problemHere={activeProbAt === 0} />
          <Connector active={agentStates[0] === "fail" || activeProbAt === 1 || agentStates[1] !== "idle"} />
          <AgentCard index={1} state={agentStates[1]} problemHere={activeProbAt === 1} />
          <Connector active={agentStates[1] === "fail" || activeProbAt === 2 || agentStates[2] !== "idle"} />
          <AgentCard index={2} state={agentStates[2]} problemHere={activeProbAt === 2} />
        </div>

        {/* Status ticker */}
        <div style={{
          background: T.bg,
          border: `1px solid ${T.border}`,
          borderRadius: 14, padding: "14px 22px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 16, minHeight: 52,
          boxShadow: "0 1px 4px rgba(83,74,183,0.05)",
          marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
              background: statusColor,
              boxShadow: statusKind !== "default" ? `0 0 0 3px ${statusColor}22` : "none",
              transition: "background 0.3s, box-shadow 0.3s",
              display: "inline-block",
            }} />
            <p
              key={statusMsg}
              style={{
                fontSize: 13, color: statusColor, margin: 0, fontWeight: 500,
                animation: "tickerIn 0.3s ease both",
              }}
            >
              {statusMsg}
            </p>
          </div>

          {/* Countdown ring */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="9" cy="9" r="7.5" fill="none" stroke={T.border} strokeWidth="2" />
              <circle
                cx="9" cy="9" r="7.5" fill="none"
                stroke={T.purple} strokeWidth="2" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 7.5}
                strokeDashoffset={2 * Math.PI * 7.5 * (1 - countdown / (CYCLE_MS / 1000))}
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <span style={{ fontSize: 12, color: T.textHint, fontVariantNumeric: "tabular-nums" }}>
              {countdown}s
            </span>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {[
            { value: "80%", label: "Tickets auto-resolved", color: T.purple },
            { value: "1.4s", label: "Avg response time", color: T.green },
            { value: "24/7", label: "Always on", color: T.amber },
          ].map(stat => (
            <div key={stat.label} style={{
              background: T.bg,
              border: `1px solid ${T.border}`,
              borderRadius: 14, padding: "18px 20px", textAlign: "center",
              boxShadow: "0 1px 4px rgba(83,74,183,0.04)",
            }}>
              <p style={{
                fontSize: "clamp(1.4rem,2.5vw,1.8rem)", fontWeight: 800,
                color: stat.color, margin: "0 0 4px", letterSpacing: "-0.04em",
              }}>
                {stat.value}
              </p>
              <p style={{ fontSize: 12, color: T.textBody, margin: 0, fontWeight: 500 }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
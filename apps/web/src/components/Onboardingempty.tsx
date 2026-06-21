"use client";

import { S } from "@/components/ui";
import { useEffect, useState } from "react";

const STEPS = [
  {
    number: "01",
    icon: "book",
    title: "Upload your knowledge base",
    description:
      "Add FAQs, PDFs, or docs so your AI agent can answer customer questions accurately.",
    action: "Go to Knowledge Base",
    page: "knowledge",
    color: S.purple,
  },
  {
    number: "02",
    icon: "plug",
    title: "Get your API key",
    description:
      "Generate an API key and embed the chat widget on your website or app.",
    action: "Go to API Tools",
    page: "tools",
    color: "#0ea5e9",
  },
  {
    number: "03",
    icon: "users",
    title: "Invite your support team",
    description:
      "Add support agents who will handle escalated tickets that the AI can't resolve.",
    action: "Go to Team",
    page: "team",
    color: "#f59e0b",
  },
  {
    number: "04",
    icon: "settings",
    title: "Customize your widget",
    description:
      "Set your brand colors, greeting message, and widget position to match your site.",
    action: "Go to Settings",
    page: "settings",
    color: S.green,
  },
];

interface OnboardingEmptyStateProps {
  onNavigate: (page: string) => void;
}

function useIsSmallScreen(breakpoint = 600) {
  const [isSmall, setIsSmall] = useState(
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false,
  );

  useEffect(() => {
    const handleResize = () => setIsSmall(window.innerWidth <= breakpoint);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isSmall;
}

export function OnboardingEmptyState({
  onNavigate,
}: OnboardingEmptyStateProps) {
  const isSmallScreen = useIsSmallScreen(600);

  return (
    <div style={{ padding: "2rem", maxWidth: 860, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${S.purple}12 0%, #0ea5e912 100%)`,
          border: `1px solid ${S.purple}20`,
          borderRadius: 16,
          padding: "2rem",
          marginBottom: "2rem",
          display: isSmallScreen ? "block" : "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: S.purple,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <i className="ti ti-rocket" style={{ fontSize: 24, color: "#fff" }} />
        </div>
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: S.dark,
              margin: "0 0 4px",
            }}
          >
            Welcome to SupportNest 👋
          </h1>
          <p style={{ fontSize: 14, color: S.textMuted, margin: 0 }}>
            Your dashboard is ready. Complete these steps to start resolving
            customer tickets with AI.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {STEPS.map((step) => (
          <div
            key={step.number}
            style={{
              background: S.surface,
              border: `0.5px solid ${S.border}`,
              borderRadius: 12,
              padding: "1.25rem 1.5rem",
              display: isSmallScreen ? "block" : "flex",
              alignItems: "center",
              gap: 16,
              transition: "box-shadow .15s",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 4px 16px rgba(83,74,183,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            {/* Step number */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: `${step.color}12`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <i
                className={`ti ti-${step.icon}`}
                style={{ fontSize: 18, color: step.color }}
              />
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: step.color,
                    letterSpacing: ".06em",
                  }}
                >
                  STEP {step.number}
                </span>
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: S.dark,
                  marginBottom: 2,
                }}
              >
                {step.title}
              </div>
              <div
                style={{ fontSize: 12, color: S.textMuted, lineHeight: 1.5 }}
              >
                {step.description}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => onNavigate(step.page)}
              style={{
                flexShrink: 0,
                padding: "7px 14px",
                borderRadius: 8,
                border: `1.5px solid ${step.color}30`,
                background: `${step.color}08`,
                color: step.color,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                transition: "all .15s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = step.color;
                el.style.color = "#fff";
                el.style.borderColor = step.color;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = `${step.color}08`;
                el.style.color = step.color;
                el.style.borderColor = `${step.color}30`;
              }}
            >
              {step.action} →
            </button>
          </div>
        ))}
      </div>

      {/* Bottom tip */}
      <div
        style={{
          marginTop: "1.5rem",
          padding: "1rem 1.25rem",
          background: S.surface,
          border: `0.5px solid ${S.border}`,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 13,
          color: S.textMuted,
        }}
      >
        <i
          className="ti ti-info-circle"
          style={{ fontSize: 16, color: S.purple, flexShrink: 0 }}
        />
       
      </div>
    </div>
  );
}

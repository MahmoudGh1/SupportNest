"use client";

import { useState } from "react";
import { S } from "./ui";
import { ProfileSection } from "./Profile/Profilesection";
import { PasswordSection } from "./Profile/Passwordsection";
import { DangerZone } from "./Profile/Dangerzone";
import { ApiKeysSection } from "./Profile/Apikeyssection";
import { Section } from "./Profile/Ui";
import { useAuth } from "@/context/auth-context";

export default function ProfilePage() {
  const { user } = useAuth();
  const role = String(user?.role).toUpperCase();
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isSupportAgent = role === "SUPPORT_AGENT";
  const hideApiKeys = isSuperAdmin || isSupportAgent;

  const [tab, setTab] = useState<"profile" | "apikeys">("profile");

  const tabStyle = (t: typeof tab) => ({
    padding: "8px 18px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    border: "none",
    fontFamily: "inherit",
    background: tab === t ? S.purple : "transparent",
    color: tab === t ? "#fff" : S.textMuted,
    transition: "all .15s",
  });

  return (
    <div
      style={{
        padding: "1.5rem",
        overflowY: "auto",
        maxWidth: 780,
        margin: "0 auto",
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            margin: "0 0 4px",
            fontSize: 18,
            fontWeight: 600,
            color: S.dark,
          }}
        >
          {hideApiKeys ? "Profile" : "Profile & API Keys"}
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: S.textMuted }}>
          {hideApiKeys
            ? "Manage your account details."
            : "Manage your account details and widget authentication keys."}
        </p>
      </div>

      {/* ── Tab switcher — hide API Keys if role restricted ── */}
      {!hideApiKeys && (
        <div
          style={{
            display: "inline-flex",
            gap: 4,
            background: S.bg,
            border: `0.5px solid ${S.border}`,
            borderRadius: 10,
            padding: 4,
            marginBottom: 24,
          }}
        >
          <button style={tabStyle("profile")} onClick={() => setTab("profile")}>
            <i className="ti ti-user" style={{ fontSize: 14, marginRight: 6 }} />
            Profile
          </button>
          <button style={tabStyle("apikeys")} onClick={() => setTab("apikeys")}>
            <i className="ti ti-key" style={{ fontSize: 14, marginRight: 6 }} />
            API Keys
          </button>
        </div>
      )}

      {/* ── Profile tab — always visible ── */}
      {(tab === "profile" || hideApiKeys) && (
        <>
          <ProfileSection />
          <PasswordSection />
          <DangerZone />
        </>
      )}

      {/* ── API Keys tab — org admins only ── */}
      {tab === "apikeys" && !hideApiKeys && (
        <>
          <ApiKeysSection />
          <Section
            title="Widget embed snippet"
            subtitle="Paste this in the <head> of your website."
          >
            <div
              style={{
                background: "#1a1830",
                borderRadius: 10,
                padding: "1rem 1.25rem",
              }}
            >
              <code
                style={{
                  fontFamily: "monospace",
                  fontSize: 12,
                  color: "#AFA9EC",
                  lineHeight: 1.8,
                  whiteSpace: "pre-wrap",
                  display: "block",
                }}
              >
                {`<script src="https://cdn.supportnest.ai/widget.js" data-widget-key="sn_live_YOUR_KEY_HERE"></script>`}
              </code>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
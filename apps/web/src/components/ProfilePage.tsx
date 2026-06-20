"use client";

import { useState } from "react";
import { S } from "./ui";
import { ProfileSection } from "./Profile/Profilesection";
import { PasswordSection } from "./Profile/Passwordsection";
import { DangerZone } from "./Profile/Dangerzone";
import { ApiKeysSection } from "./Profile/Apikeyssection";
import { Section } from "./Profile/Ui";
import { useAuth } from "@/context/auth-context";
import { Trans, useLingui } from "@lingui/react/macro";

export default function ProfilePage() {
  const { t } = useLingui();
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
    <div style={{ padding: "1.5rem", overflowY: "auto", maxWidth: 780, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 600, color: S.dark }}>
          {hideApiKeys ? <Trans>Profile</Trans> : <Trans>Profile & API Keys</Trans>}
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: S.textMuted }}>
          {hideApiKeys
            ? <Trans>Manage your account details.</Trans>
            : <Trans>Manage your account details and widget authentication keys.</Trans>}
        </p>
      </div>

      {!hideApiKeys && (
        <div style={{
          display: "inline-flex",
          gap: 4,
          background: S.bg,
          border: `0.5px solid ${S.border}`,
          borderRadius: 10,
          padding: 4,
          marginBottom: 24,
        }}>
          <button style={tabStyle("profile")} onClick={() => setTab("profile")}>
            <i className="ti ti-user" style={{ fontSize: 14, marginRight: 6 }} />
            <Trans>Profile</Trans>
          </button>
          <button style={tabStyle("apikeys")} onClick={() => setTab("apikeys")}>
            <i className="ti ti-key" style={{ fontSize: 14, marginRight: 6 }} />
            <Trans>API Keys</Trans>
          </button>
        </div>
      )}

      {(tab === "profile" || hideApiKeys) && (
        <>
          <ProfileSection />
          <PasswordSection />
          <DangerZone />
        </>
      )}

      {tab === "apikeys" && !hideApiKeys && (
        <>
          <ApiKeysSection />
          <Section
            title={t`Widget embed snippet`}
            subtitle={t`Paste this in the <head> of your website.`}
          >
            <div
              style={{
                background: S.surface,
                border: "1px solid #2e2a52",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              {/* header bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderBottom: "1px solid #2e2a52",
                  background: "#15132a",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#ff6b6a",
                  }}
                />
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#fbbf24",
                  }}
                />
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#34d399",
                  }}
                />
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#6b6680",
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                  }}
                >
                  HTML
                </span>
              </div>

              {/* code body */}
              <div style={{ padding: "1rem 1.25rem", overflowX: "auto" }}>
                <code
                  style={{
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New', monospace",
                    fontSize: 12.5,
                    lineHeight: 1.8,
                    whiteSpace: "pre",
                    display: "block",
                    color: "#AFA9EC",
                  }}
                >
                  {/* ── widget loader script ── */}
                  <span style={{ color: "#6b6680" }}>&lt;</span>
                  <span style={{ color: "#ff7b9c" }}>script</span>
                  {"\n"}
                  {"  "}
                  <span style={{ color: "#8b7fe8" }}>src</span>
                  <span style={{ color: "#6b6680" }}>=</span>
                  <span style={{ color: "#8de8b0" }}>
                    `https://api-production-e60c.up.railway.app/widget.js`
                  </span>
                  {"\n"}
                  {"  "}
                  <span style={{ color: "#8b7fe8" }}>id</span>
                  <span style={{ color: "#6b6680" }}>=</span>
                  <span style={{ color: "#8de8b0" }}>`widgetScript`</span>
                  {"\n"}
                  {"  "}
                  <span style={{ color: "#8b7fe8" }}>data-base-url</span>
                  <span style={{ color: "#6b6680" }}>=</span>
                  <span style={{ color: "#8de8b0" }}>
                    `https://api-production-e60c.up.railway.app`
                  </span>
                  {"\n"}
                  {"  "}
                  <span style={{ color: "#8b7fe8" }}>defer</span>
                  {"\n"}
                  <span style={{ color: "#6b6680" }}>&gt;&lt;/</span>
                  <span style={{ color: "#ff7b9c" }}>script</span>
                  <span style={{ color: "#6b6680" }}>&gt;</span>
                  {"\n\n"}

                  {/* ── init script ── */}
                  <span style={{ color: "#6b6680" }}>&lt;</span>
                  <span style={{ color: "#ff7b9c" }}>script</span>
                  <span style={{ color: "#6b6680" }}>&gt;</span>
                  {"\n"}
                  {"  "}
                  <span style={{ color: "#ff7b9c" }}>document</span>
                  <span style={{ color: "#6b6680" }}>.</span>
                  <span style={{ color: "#8b7fe8" }}>addEventListener</span>
                  <span style={{ color: "#6b6680" }}>(</span>
                  <span style={{ color: "#8de8b0" }}>`DOMContentLoaded`</span>
                  <span style={{ color: "#6b6680" }}>, () =&gt; {"{"}</span>
                  {"\n"}
                  {"    "}
                  <span style={{ color: "#ff7b9c" }}>console</span>
                  <span style={{ color: "#6b6680" }}>.</span>
                  <span style={{ color: "#8b7fe8" }}>log</span>
                  <span style={{ color: "#6b6680" }}>(</span>
                  <span style={{ color: "#ff7b9c" }}>window</span>
                  <span style={{ color: "#6b6680" }}>);</span>
                  {"\n"}
                  {"    "}
                  <span style={{ color: "#ff7b9c" }}>fetch</span>
                  <span style={{ color: "#6b6680" }}>(</span>
                  <span style={{ color: "#8de8b0" }}>
                    `Your Backend URL/api/generate-widget-token`
                  </span>
                  <span style={{ color: "#6b6680" }}>)</span>
                  {"\n"}
                  {"      "}
                  <span style={{ color: "#6b6680" }}>.</span>
                  <span style={{ color: "#8b7fe8" }}>then</span>
                  <span style={{ color: "#6b6680" }}>((res) =&gt; res.</span>
                  <span style={{ color: "#8b7fe8" }}>json</span>
                  <span style={{ color: "#6b6680" }}>())</span>
                  {"\n"}
                  {"      "}
                  <span style={{ color: "#6b6680" }}>.</span>
                  <span style={{ color: "#8b7fe8" }}>then</span>
                  <span style={{ color: "#6b6680" }}>((data) =&gt; {"{"}</span>
                  {"\n"}
                  {"        "}
                  <span style={{ color: "#ff7b9c" }}>window</span>
                  <span style={{ color: "#6b6680" }}>.</span>
                  <span style={{ color: "#ff7b9c" }}>SupportNest</span>
                  <span style={{ color: "#6b6680" }}>.</span>
                  <span style={{ color: "#8b7fe8" }}>init</span>
                  <span style={{ color: "#6b6680" }}>({"{"}</span>
                  {"\n"}
                  {"          "}
                  <span style={{ color: "#8b7fe8" }}>widgetKey</span>
                  <span style={{ color: "#6b6680" }}>:</span>
                  {"\n"}
                  {"            "}
                  <span style={{ color: "#8de8b0" }}>
                    `sk_696837••••••••••••••••••••••••••••••••••`
                  </span>
                  <span style={{ color: "#6b6680" }}>,</span>
                  {"\n"}
                  {"          "}
                  <span style={{ color: "#8b7fe8" }}>customerToken</span>
                  <span style={{ color: "#6b6680" }}>: data.token ?? </span>
                  <span style={{ color: "#ff7b9c" }}>null</span>
                  <span style={{ color: "#6b6680" }}>,</span>
                  {"\n"}
                  {"        "}
                  <span style={{ color: "#6b6680" }}>{"});"}</span>
                  {"\n"}
                  {"      "}
                  <span style={{ color: "#6b6680" }}>{"});"}</span>
                  {"\n"}
                  {"  "}
                  <span style={{ color: "#6b6680" }}>{"});"}</span>
                  {"\n"}
                  <span style={{ color: "#6b6680" }}>&lt;/</span>
                  <span style={{ color: "#ff7b9c" }}>script</span>
                  <span style={{ color: "#6b6680" }}>&gt;</span>
                </code>
              </div>
            <div style={{ background: "#1a1830", borderRadius: 10, padding: "1rem 1.25rem" }}>
              <code style={{
                fontFamily: "monospace",
                fontSize: 12,
                color: "#AFA9EC",
                lineHeight: 1.8,
                whiteSpace: "pre-wrap",
                display: "block",
              }}>
                {`<script src="https://cdn.supportnest.ai/widget.js" data-widget-key="sn_live_YOUR_KEY_HERE"></script>`}
              </code>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

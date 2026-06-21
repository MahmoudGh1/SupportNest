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
import { WidgetSecretLine } from "./Profile/Widgetsecret";

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
          {hideApiKeys ? (
            <Trans>Profile</Trans>
          ) : (
            <Trans>Profile & API Keys</Trans>
          )}
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: S.textMuted }}>
          {hideApiKeys ? (
            <Trans>Manage your account details.</Trans>
          ) : (
            <Trans>
              Manage your account details and widget authentication keys.
            </Trans>
          )}
        </p>
      </div>

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
            <i
              className="ti ti-user"
              style={{ fontSize: 14, marginRight: 6 }}
            />
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
            title={t`Widget Secret Key`}
            subtitle={t`Take This Copy To Use It In Your Backend.`}
          >
            <div>
              <WidgetSecretLine />
            </div>
          </Section>

          <Section
            title={t`Widget embed snippet`}
            subtitle={t`Used to sign customer tokens on your server. Copy it into your backend.`}
          >
            <div className="codeBlock">
              <style jsx>{`
                .codeBlock {
                  --code-bg: #ffffff;
                  --code-border: #e5e7eb;
                  --code-header-bg: #fafafa;
                  --code-label: #6b7280;
                  --code-punct: #1f2937;
                  --code-tag: #be185d;
                  --code-keyword: #dc2626;
                  --code-attr: #2563eb;
                  --code-string: #16a34a;
                }

                :global(.dark) .codeBlock {
                  --code-bg: #1a1830;
                  --code-border: #2e2a52;
                  --code-header-bg: #15132a;
                  --code-label: #8a84b0;
                  --code-punct: #d8d5f0;
                  --code-tag: #ff7b9c;
                  --code-keyword: #ff7b9c;
                  --code-attr: #8b7fe8;
                  --code-string: #8de8b0;
                }
              `}</style>

              <div
                style={{
                  background: S.surface,
                  border: "1px solid var(--code-border)",
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
                    borderBottom: "1px solid var(--code-border)",
                    background: "var(--code-header-bg)",
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
                      fontSize: "14",
                      fontWeight: 600,
                      color: "var(--code-label)",
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
                      fontSize: 14.5,
                      lineHeight: 1.8,
                      whiteSpace: "pre",
                      display: "block",
                      color: "var(--code-punct)",
                    }}
                  >
                    {/* ── widget loader script ── */}
                    <span style={{ color: "var(--code-punct)" }}>&lt;</span>
                    <span style={{ color: "var(--code-tag)" }}>script</span>
                    {"\n"}
                    {"  "}
                    <span style={{ color: "var(--code-attr)" }}>src</span>
                    <span style={{ color: "var(--code-punct)" }}>=</span>
                    <span style={{ color: "var(--code-string)" }}>
                      `https://api-production-e60c.up.railway.app/widget.js`
                    </span>
                    {"\n"}
                    {"  "}
                    <span style={{ color: "var(--code-attr)" }}>id</span>
                    <span style={{ color: "var(--code-punct)" }}>=</span>
                    <span style={{ color: "var(--code-string)" }}>
                      `widgetScript`
                    </span>
                    {"\n"}
                    {"  "}
                    <span style={{ color: "var(--code-attr)" }}>
                      data-base-url
                    </span>
                    <span style={{ color: "var(--code-punct)" }}>=</span>
                    <span style={{ color: "var(--code-string)" }}>
                      `https://api-production-e60c.up.railway.app`
                    </span>
                    {"\n"}
                    {"  "}
                    <span style={{ color: "var(--code-attr)" }}>defer</span>
                    {"\n"}
                    <span style={{ color: "var(--code-punct)" }}>
                      &gt;&lt;/
                    </span>
                    <span style={{ color: "var(--code-tag)" }}>script</span>
                    <span style={{ color: "var(--code-punct)" }}>&gt;</span>
                    {"\n\n"}

                    {/* ── init script ── */}
                    <span style={{ color: "var(--code-punct)" }}>&lt;</span>
                    <span style={{ color: "var(--code-tag)" }}>script</span>
                    <span style={{ color: "var(--code-punct)" }}>&gt;</span>
                    {"\n"}
                    {"  "}
                    <span style={{ color: "var(--code-keyword)" }}>
                      document
                    </span>
                    <span style={{ color: "var(--code-punct)" }}>.</span>
                    <span style={{ color: "var(--code-attr)" }}>
                      addEventListener
                    </span>
                    <span style={{ color: "var(--code-punct)" }}>(</span>
                    <span style={{ color: "var(--code-string)" }}>
                      `DOMContentLoaded`
                    </span>
                    <span style={{ color: "var(--code-punct)" }}>
                      , () =&gt; {"{"}
                    </span>
                    {"\n"}
                    {"    "}
                    <span style={{ color: "var(--code-keyword)" }}>
                      console
                    </span>
                    <span style={{ color: "var(--code-punct)" }}>.</span>
                    <span style={{ color: "var(--code-attr)" }}>log</span>
                    <span style={{ color: "var(--code-punct)" }}>(</span>
                    <span style={{ color: "var(--code-keyword)" }}>window</span>
                    <span style={{ color: "var(--code-punct)" }}>);</span>
                    {"\n"}
                    {"    "}
                    <span style={{ color: "var(--code-keyword)" }}>fetch</span>
                    <span style={{ color: "var(--code-punct)" }}>(</span>
                    <span style={{ color: "var(--code-string)" }}>
                      `Your Backend URL/api/generate-widget-token`
                    </span>
                    <span style={{ color: "var(--code-punct)" }}>)</span>
                    {"\n"}
                    {"      "}
                    <span style={{ color: "var(--code-punct)" }}>.</span>
                    <span style={{ color: "var(--code-attr)" }}>then</span>
                    <span style={{ color: "var(--code-punct)" }}>
                      ((res) =&gt; res.
                    </span>
                    <span style={{ color: "var(--code-attr)" }}>json</span>
                    <span style={{ color: "var(--code-punct)" }}>())</span>
                    {"\n"}
                    {"      "}
                    <span style={{ color: "var(--code-punct)" }}>.</span>
                    <span style={{ color: "var(--code-attr)" }}>then</span>
                    <span style={{ color: "var(--code-punct)" }}>
                      ((data) =&gt; {"{"}
                    </span>
                    {"\n"}
                    {"        "}
                    <span style={{ color: "var(--code-keyword)" }}>window</span>
                    <span style={{ color: "var(--code-punct)" }}>.</span>
                    <span style={{ color: "var(--code-keyword)" }}>
                      SupportNest
                    </span>
                    <span style={{ color: "var(--code-punct)" }}>.</span>
                    <span style={{ color: "var(--code-attr)" }}>init</span>
                    <span style={{ color: "var(--code-punct)" }}>({"{"}</span>
                    {"\n"}
                    {"          "}
                    <span style={{ color: "var(--code-attr)" }}>widgetKey</span>
                    <span style={{ color: "var(--code-punct)" }}>:</span>
                    {"\n"}
                    {"            "}
                    <span style={{ color: "var(--code-string)" }}>
                      `sk_696837••••••••••••••••••••••••••••••••••`
                    </span>
                    <span style={{ color: "var(--code-punct)" }}>,</span>
                    {"\n"}
                    {"          "}
                    <span style={{ color: "var(--code-attr)" }}>
                      customerToken
                    </span>
                    <span style={{ color: "var(--code-punct)" }}>
                      : data.token ??{" "}
                    </span>
                    <span style={{ color: "var(--code-keyword)" }}>null</span>
                    <span style={{ color: "var(--code-punct)" }}>,</span>
                    {"\n"}
                    {"        "}
                    <span style={{ color: "var(--code-punct)" }}>{"});"}</span>
                    {"\n"}
                    {"      "}
                    <span style={{ color: "var(--code-punct)" }}>{"});"}</span>
                    {"\n"}
                    {"  "}
                    <span style={{ color: "var(--code-punct)" }}>{"});"}</span>
                    {"\n"}
                    <span style={{ color: "var(--code-punct)" }}>&lt;/</span>
                    <span style={{ color: "var(--code-tag)" }}>script</span>
                    <span style={{ color: "var(--code-punct)" }}>&gt;</span>
                  </code>
                </div>
              </div>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

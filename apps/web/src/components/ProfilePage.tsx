"use client";

import { useState } from "react";
import { S } from "./ui";
import { ProfileSection } from "./Profile/Profilesection";
import { PasswordSection } from "./Profile/Passwordsection";
import { DangerZone } from "./Profile/Dangerzone";
import { ApiKeysSection } from "./Profile/Apikeyssection";
import { Section } from "./Profile/Ui";

export default function ProfilePage() {
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
          Profile & API Keys
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: S.textMuted }}>
          Manage your account details and widget authentication keys.
        </p>
      </div>

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

      {tab === "profile" && (
        <>
          <ProfileSection />
          <PasswordSection />
          <DangerZone />
        </>
      )}

      {tab === "apikeys" && (
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
                {`<script>
  window.SupportNestConfig = {
    apiKey: "sn_live_YOUR_KEY_HERE",
    // color: "#534AB7",
    // position: "bottom-right",
  };
</script>
<script
  src="https://cdn.supportnest.ai/widget.js"
  async
></script>`}
              </code>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

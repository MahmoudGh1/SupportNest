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
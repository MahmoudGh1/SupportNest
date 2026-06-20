"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { S } from "@/components/ui";
import { Trans, useLingui } from "@lingui/react/macro";

type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  company?: string;
  message: string;
  createdAt: string;
};

function fmtDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ContactSubmissionsPage() {
  const { t } = useLingui();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getContactSubmissions()
      .then(setSubmissions)
      .catch((err) => setError(err.message || t`Failed to load`))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "2rem", color: S.textMuted }}><Trans>Loading...</Trans></div>;
  if (error) return <div style={{ padding: "2rem", color: S.danger }}>{error}</div>;

  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: S.textMuted, letterSpacing: ".06em", textTransform: "uppercase", margin: "0 0 4px" }}>
          <Trans>Inbound Leads</Trans>
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 750, color: S.dark, margin: 0 }}>
          <Trans>Contact Submissions</Trans>
          <span style={{ marginLeft: 10, fontSize: 14, fontWeight: 600, padding: "2px 10px", borderRadius: 999, background: S.purpleBg, color: S.purple }}>
            {submissions.length}
          </span>
        </h1>
      </div>

      <div style={{ background: S.surface, borderRadius: 12, border: `0.5px solid ${S.border}`, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr 2fr 0.8fr 1fr", gap: 12, padding: "12px 20px", borderBottom: `0.5px solid ${S.border}`, fontSize: 11, fontWeight: 600, color: S.textMuted, textTransform: "uppercase" }}>
          <div><Trans>Name</Trans></div>
          <div><Trans>Email</Trans></div>
          <div><Trans>Company</Trans></div>
          <div><Trans>Message</Trans></div>
          <div><Trans>Date</Trans></div>
          <div style={{ textAlign: "right" }}><Trans>Actions</Trans></div>
        </div>

        {submissions.length === 0 && (
          <div style={{ padding: "3rem", textAlign: "center", color: S.textMuted, fontSize: 13 }}>
            <i className="ti ti-mail-off" style={{ fontSize: 32, display: "block", marginBottom: 8, opacity: 0.4 }} />
            <Trans>No submissions yet.</Trans>
          </div>
        )}

        {submissions.map((s) => (
          <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr 2fr 0.8fr 1fr", gap: 12, padding: "14px 20px", alignItems: "start", borderBottom: `0.5px solid ${S.border}`, fontSize: 13 }}>
            <div style={{ fontWeight: 600, color: S.dark }}>{s.name}</div>
            <div style={{ color: S.textMuted, wordBreak: "break-all" }}>{s.email}</div>
            <div style={{ color: S.textMuted }}>{s.company || "—"}</div>
            <div style={{ color: S.dark, lineHeight: 1.5 }}>{s.message}</div>
            <div style={{ fontSize: 11, color: S.textMuted }}>{fmtDate(s.createdAt)}</div>
            <div style={{ textAlign: "right" }}>
              <a
                href={`mailto:${s.email}?subject=Re: Contact Submission - SupportNest`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 6,
                  background: S.purpleBg,
                  color: S.purple,
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "opacity 0.2s"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <i className="ti ti-mail-forward" style={{ fontSize: 14 }} />
                <Trans>Reply</Trans>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
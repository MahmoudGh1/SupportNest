"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { S } from "@/components/ui";

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
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getContactSubmissions()
      .then(setSubmissions)
      .catch((err) => setError(err.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "2rem", color: S.textMuted }}>Loading...</div>;
  if (error) return <div style={{ padding: "2rem", color: S.danger }}>{error}</div>;

  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: S.textMuted, letterSpacing: ".06em", textTransform: "uppercase", margin: "0 0 4px" }}>Inbound Leads</p>
        <h1 style={{ fontSize: 24, fontWeight: 750, color: S.dark, margin: 0 }}>
          Contact Submissions
          <span style={{ marginLeft: 10, fontSize: 14, fontWeight: 600, padding: "2px 10px", borderRadius: 999, background: S.purpleBg, color: S.purple }}>
            {submissions.length}
          </span>
        </h1>
      </div>

      <div style={{ background: S.surface, borderRadius: 12, border: `0.5px solid ${S.border}`, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr 2.5fr 0.8fr", gap: 12, padding: "12px 20px", borderBottom: `0.5px solid ${S.border}`, fontSize: 11, fontWeight: 600, color: S.textMuted, textTransform: "uppercase" }}>
          <div>Name</div>
          <div>Email</div>
          <div>Company</div>
          <div>Message</div>
          <div>Date</div>
        </div>

        {submissions.length === 0 && (
          <div style={{ padding: "3rem", textAlign: "center", color: S.textMuted, fontSize: 13 }}>
            <i className="ti ti-mail-off" style={{ fontSize: 32, display: "block", marginBottom: 8, opacity: 0.4 }} />
            No submissions yet.
          </div>
        )}

        {submissions.map((s) => (
          <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr 2.5fr 0.8fr", gap: 12, padding: "14px 20px", alignItems: "start", borderBottom: `0.5px solid ${S.border}`, fontSize: 13 }}>
            <div style={{ fontWeight: 600, color: S.dark }}>{s.name}</div>
            <div style={{ color: S.textMuted, wordBreak: "break-all" }}>{s.email}</div>
            <div style={{ color: S.textMuted }}>{s.company || "—"}</div>
            <div style={{ color: S.dark, lineHeight: 1.5 }}>{s.message}</div>
            <div style={{ fontSize: 11, color: S.textMuted }}>{fmtDate(s.createdAt)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
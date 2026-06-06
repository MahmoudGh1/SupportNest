"use client"

import { useEffect, useState } from "react"
import { api, DashboardStats } from "@/lib/mock-api"
import { StatusBadge, S } from "@/components/ui"

function StatCard({ label, value, delta, icon }: { label: string; value: string | number; delta: string; icon: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, padding: "1rem 1.1rem", border: `0.5px solid ${S.border}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: S.textMuted }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: S.purpleBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i className={`ti ti-${icon}`} style={{ fontSize: 16, color: S.purple }} />
        </div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 600, color: S.dark, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: S.green }}>{delta}</div>
    </div>
  )
}

function TierBar({ tier1, tier2, human }: { tier1: number; tier2: number; human: number }) {
  return (
    <div>
      {[
        { label: "Tier 1 — AI Instant",  pct: tier1, color: S.purple      },
        { label: "Tier 2 — AI Complex",  pct: tier2, color: S.purpleLight },
        { label: "Human Agent",           pct: human, color: "#AFA9EC"     },
      ].map(item => (
        <div key={item.label} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 12, color: S.textSecondary }}>{item.label}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: S.dark }}>{item.pct}%</span>
          </div>
          <div style={{ height: 6, background: S.border, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${item.pct}%`, background: item.color, borderRadius: 3, transition: "width .6s ease" }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function OverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    api.getDashboardStats().then(setStats)
  }, [])

  if (!stats) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: S.textMuted }}>
        <i className="ti ti-loader-2" style={{ fontSize: 24, animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ padding: "1.5rem", overflowY: "auto" }}>
      <p style={{ fontSize: 11, fontWeight: 500, color: S.textMuted, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 12, marginTop: 0 }}>
        At a glance
      </p>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Conversations" value={stats.totalConversations.toLocaleString()} delta="↑ 12% this week"   icon="message-2"   />
        <StatCard label="AI Resolution Rate"  value={`${stats.aiResolutionRate}%`}              delta="↑ 3% vs last week" icon="chart-bar"   />
        <StatCard label="Avg Response Time"   value={stats.avgResponseTime}                     delta="↓ 0.2s improvement" icon="clock"      />
        <StatCard label="CSAT Score"          value={stats.csatScore}                           delta="↑ 0.3 this month"   icon="star"       />
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Recent conversations table */}
        <div style={{ background: "#fff", borderRadius: 12, border: `0.5px solid ${S.border}`, padding: "1.25rem" }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: S.dark, marginBottom: 14, marginTop: 0 }}>Recent Conversations</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["Customer", "Status", "Tier", "Time"].map(h => (
                  <th key={h} style={{ textAlign: "left", color: S.textMuted, fontWeight: 500, fontSize: 10, letterSpacing: ".05em", textTransform: "uppercase", paddingBottom: 10, borderBottom: `0.5px solid ${S.border}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recentConversations.map(c => (
                <tr key={c.id}>
                  <td style={{ padding: "9px 0", borderBottom: `0.5px solid ${S.bg}`, color: S.dark }}>{c.customer}</td>
                  <td style={{ padding: "9px 0", borderBottom: `0.5px solid ${S.bg}` }}><StatusBadge status={c.status} /></td>
                  <td style={{ padding: "9px 0", borderBottom: `0.5px solid ${S.bg}`, color: S.textMuted }}>{c.tier}</td>
                  <td style={{ padding: "9px 0", borderBottom: `0.5px solid ${S.bg}`, color: S.textMuted }}>{c.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resolution by tier */}
        <div style={{ background: "#fff", borderRadius: 12, border: `0.5px solid ${S.border}`, padding: "1.25rem" }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: S.dark, marginBottom: 16, marginTop: 0 }}>Resolution by Tier</p>
          <TierBar {...stats.resolutionByTier} />
        </div>
      </div>
    </div>
  )
}

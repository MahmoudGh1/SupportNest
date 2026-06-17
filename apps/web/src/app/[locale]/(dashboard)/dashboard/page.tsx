"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { StatusBadge, S } from "@/components/ui";
import { DashboardStats, DashboardStatsStatus, Tiers } from "@/types/types";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { ST } from "next/dist/shared/lib/utils";
import { useLingui } from "@lingui/react";

function StatCard({
  label,
  value,
  delta,
  icon,
}: {
  label: string;
  value: string | number;
  delta: string;
  icon: string;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 10,
        padding: "1rem 1.1rem",
        border: `0.5px solid var(--card-border)`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 12, color: "var(--page-muted)" }}>
          {label}
        </span>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "var(--color-brand-faint)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <i
            className={`ti ti-${icon}`}
            style={{ fontSize: 16, color: "var(--color-brand)" }}
          />
        </div>
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: "var(--page-text)",
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: "var(--color-success)" }}>{delta}</div>
    </div>
  );
}

function TierBar({
  tier1,
  tier2,
  human,
}: {
  tier1: number;
  tier2: number;
  human: number;
}) {
  return (
    <div>
      {[
        {
          label: t`Tier 1 — AI Instant`,
          pct: tier1,
          color: "var(--color-brand)",
        },
        {
          label: t`Tier 2 — AI Complex`,
          pct: tier2,
          color: "var(--color-brand-light)",
        },
        { label: t`Human Agent`, pct: human, color: "var(--color-brand-mid)" },
      ].map((item) => (
        <div key={item.label} style={{ marginBottom: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 5,
            }}
          >
            <span style={{ fontSize: 12, color: "var(--page-muted)" }}>
              {item.label}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--page-text)",
              }}
            >
              {item.pct}%
            </span>
          </div>
          <div
            style={{
              height: 6,
              background: "var(--card-border)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${item.pct}%`,
                background: item.color,
                borderRadius: 3,
                transition: "width .6s ease",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const { i18n } = useLingui();

  const TIER_LABELS = {
    TIER_1: t`Tier 1`,
    TIER_2: t`Tier 2`,
    HUMAN: t`Human`,
  };

  const STATUS_LABELS = {
    ACTIVE: t`Active`,
    ESCALATED: t`Escalated`,
    CLOSED: t`Closed`,
  };

  useEffect(() => {
    api.getDashboardStats().then(setStats);
  }, []);

  if (!stats) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "var(--page-muted)",
        }}
      >
        <i
          className="ti ti-loader-2"
          style={{ fontSize: 24, animation: "spin 1s linear infinite" }}
        />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", overflowY: "auto" }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "var(--page-muted)",
          letterSpacing: ".06em",
          textTransform: "uppercase",
          marginBottom: 12,
          marginTop: 0,
        }}
      >
        <Trans>At a glance</Trans>
      </p>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", // ← changed
          gap: 12,
          marginBottom: 20,
        }}
      >
        <StatCard
          label={t`Total Conversations`}
          value={stats.totalConversations.toLocaleString()}
          delta={t`↑ 12% this week`}
          icon="message-2"
        />
        <StatCard
          label={t`AI Resolution Rate`}
          value={`${stats.aiResolutionRate}%`}
          delta={t`↑ 3% vs last week`}
          icon="chart-bar"
        />
        <StatCard
          label={t`Avg Response Time`}
          value={stats.avgResponseTime}
          delta={t`↓ 0.2s improvement`}
          icon="clock"
        />
        <StatCard
          label={t`CSAT Score`}
          value={stats.csatScore}
          delta={t`↑ 0.3 this month`}
          icon="star"
        />
      </div>

      {/* Bottom row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 12,
        }} // ← changed
      >
        {/* Recent conversations table */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 12,
            border: `0.5px solid ${S.border}`,
            padding: "1.25rem",
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--page-muted)",
              marginBottom: 14,
              marginTop: 0,
            }}
          >
            <Trans>Recent Conversations</Trans>
          </p>
          <div style={{ overflowX: "auto" }}>
            {" "}
            {/* ← added */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
              }}
            >
              <thead>
                <tr>
                  {[t`Customer`, t`Status`, t`Tier`, t`Time`].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        color: "var(--page-muted)",
                        fontWeight: 500,
                        fontSize: 10,
                        letterSpacing: ".05em",
                        textTransform: "uppercase",
                        paddingBottom: 10,
                        borderBottom: `0.5px solid var(--card-border)`,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recentConversations.map((c) => (
                  <tr key={c.id}>
                    <td
                      style={{
                        padding: "9px 0",
                        borderBottom: `0.5px solid var(--surface)`,
                        color: "var(--page-text)",
                      }}
                    >
                      {c.customer}
                    </td>
                    <td
                      style={{
                        padding: "9px 0",
                        borderBottom: `0.5px solid var(--surface)`,
                      }}
                    >
                      <StatusBadge status={c.status} />
                    </td>
                    <td
                      style={{
                        padding: "9px 0",
                        borderBottom: `0.5px solid var(--surface)`,
                        color: "var(--page-muted)",
                      }}
                    >
                      {i18n._(TIER_LABELS[c.tier]) as Tiers}
                    </td>
                    <td
                      style={{
                        padding: "9px 0",
                        borderBottom: `0.5px solid var(--surface)`,
                        color: "var(--page-muted)",
                      }}
                    >
                      {c.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>{" "}
          {/* ← closes overflowX wrapper */}
        </div>

        {/* Resolution by tier */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 12,
            border: `0.5px solid ${S.border}`,
            padding: "1.25rem",
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: S.dark,
              marginBottom: 16,
              marginTop: 0,
            }}
          >
            Resolution by Tier
          </p>
          <TierBar {...stats.resolutionByTier} />
        </div>
      </div>
    </div>
  );
}

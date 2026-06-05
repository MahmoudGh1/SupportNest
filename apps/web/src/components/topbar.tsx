"use client"

import { S } from "@/components/ui"
import { useAuth } from "@/context/auth-context"

interface TopbarProps {
  pageTitle: string
  onToggleSidebar: () => void
}

export function Topbar({ pageTitle, onToggleSidebar }: TopbarProps) {
  const { user } = useAuth()
  const initials = user
    ? `${user.firstName?.[0]}${user.lastName?.[0]}`.toUpperCase()
    : "U"

  return (
    <div style={{
      background: "#fff",
      borderBottom: `0.5px solid ${S.border}`,
      padding: "0 1.5rem",
      height: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onToggleSidebar}
          style={{ background: "none", border: "none", cursor: "pointer", color: S.textMuted, display: "flex", padding: 4, borderRadius: 6 }}
        >
          <i className="ti ti-menu-2" style={{ fontSize: 19 }} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 600, color: S.dark }}>{pageTitle}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button style={{
          width: 34, height: 34, borderRadius: 8, border: `0.5px solid ${S.border}`,
          background: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", color: S.textMuted,
        }}>
          <i className="ti ti-bell" style={{ fontSize: 17 }} />
        </button>
        <button style={{
          width: 34, height: 34, borderRadius: 8, border: `0.5px solid ${S.border}`,
          background: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", color: S.textMuted,
        }}>
          <i className="ti ti-search" style={{ fontSize: 17 }} />
        </button>
        <div style={{
          width: 34, height: 34, borderRadius: "50%", background: S.purple,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 500, color: "#fff", cursor: "pointer",
        }}>
          {initials}
        </div>
      </div>
    </div>
  )
}

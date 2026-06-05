"use client"

import { S } from "@/components/ui"
import { useAuth } from "@/context/auth-context"

const navItems = [
  { icon: "layout-dashboard", label: "Overview",      page: "dashboard"     },
  { icon: "message-2",        label: "Conversations", page: "conversations" },
  { icon: "ticket",           label: "Tickets",       page: "tickets"       },
  { icon: "book",             label: "Knowledge Base",page: "knowledge"     },
  { icon: "users",            label: "Team",          page: "team"          },
  { icon: "chart-bar",        label: "Analytics",     page: "analytics"     },
  { icon: "code",             label: "API & Widget",  page: "api"           },
  { icon: "settings",         label: "Settings",      page: "settings"      },
]

interface SidebarProps {
  currentPage: string
  onNavigate: (page: string) => void
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ currentPage, onNavigate, collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth()
  const initials = user ? `${user.firstName?.[0]}${user.lastName?.[0]}`.toUpperCase() : "U"

  return (
    <div style={{
      width: collapsed ? 64 : 220,
      minWidth: collapsed ? 64 : 220,
      background: S.dark,
      display: "flex",
      flexDirection: "column",
      transition: "width .2s, min-width .2s",
      overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "1.25rem 1rem 1rem",
        borderBottom: "0.5px solid rgba(255,255,255,0.08)",
        minWidth: 0,
      }}>
        <div style={{
          width: 32, height: 32, background: S.purple, borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <i className="ti ti-shield-check" style={{ color: "#fff", fontSize: 16 }} />
        </div>
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>SupportNest</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.orgName || "Your workspace"}
            </div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, padding: "1rem 0.6rem", display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map(item => {
          const isActive = currentPage === item.page
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              title={collapsed ? item.label : ""}
              style={{
                display: "flex", alignItems: "center",
                gap: 10, padding: collapsed ? "9px 14px" : "8px 10px",
                borderRadius: 8, cursor: "pointer", border: "none",
                background: isActive ? S.purple : "transparent",
                color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
                fontSize: 13, fontFamily: "inherit",
                transition: "all .15s",
                whiteSpace: "nowrap",
                justifyContent: collapsed ? "center" : "flex-start",
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = "rgba(255,255,255,0.06)"
                  el.style.color = "rgba(255,255,255,0.85)"
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = "transparent"
                  el.style.color = "rgba(255,255,255,0.5)"
                }
              }}
            >
              <i className={`ti ti-${item.icon}`} style={{ fontSize: 17, flexShrink: 0 }} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </div>

      {/* AI Mode button */}
      {!collapsed && (
        <div style={{ padding: "0 0.75rem 0.75rem" }}>
          <button style={{
            width: "100%", background: S.purple, border: "none", borderRadius: 8,
            color: "#fff", fontFamily: "inherit", fontSize: 12, fontWeight: 500,
            padding: "10px 14px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <i className="ti ti-bolt" style={{ fontSize: 15 }} /> AI Mode
          </button>
        </div>
      )}

      {/* Bottom: user info + logout */}
      <div style={{ padding: "0.75rem", borderTop: "0.5px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 2 }}>
        {!collapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", background: S.purple,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 500, color: "#fff", flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.firstName} {user?.lastName}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.role?.replace("_", " ")}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          title={collapsed ? "Logout" : ""}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: collapsed ? "9px 14px" : "8px 10px",
            borderRadius: 8, cursor: "pointer", border: "none",
            background: "transparent", color: "rgba(255,255,255,0.35)",
            fontFamily: "inherit", fontSize: 12,
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          <i className="ti ti-logout" style={{ fontSize: 16 }} />
          {!collapsed && "Logout"}
        </button>
      </div>
    </div>
  )
}

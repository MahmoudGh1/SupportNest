"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Topbar } from "@/components/topbar"
import { ProtectedRoute } from "@/components/protected-route"

const pageMeta: Record<string, string> = {
  "/dashboard":              "Overview",
  "/dashboard/conversations":"Conversations",
  "/dashboard/tickets":      "Tickets",
  "/dashboard/knowledge":    "Knowledge Base",
  "/dashboard/analytics":    "Analytics",
  "/dashboard/settings":     "Settings",
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router   = useRouter()

  const title = pageMeta[pathname] ?? "Dashboard"

  // Map pathname → sidebar page key
  const currentPage = pathname.replace("/dashboard", "").replace("/", "") || "dashboard"

  const handleNavigate = (page: string) => {
    router.push(page === "dashboard" ? "/dashboard" : `/dashboard/${page}`)
  }

  return (
    <ProtectedRoute>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Sora', system-ui, sans-serif" }}>
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          collapsed={collapsed}
          onToggle={() => setCollapsed(c => !c)}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Topbar pageTitle={title} onToggleSidebar={() => setCollapsed(c => !c)} />
          <div style={{ flex: 1, overflow: "auto", background: "#fafafa" }}>
            {children}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

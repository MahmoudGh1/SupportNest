import { S } from "@/components/ui"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, #1a1830 0%, #252240 40%, #1a1830 100%)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Sora', system-ui, sans-serif",
    }}>
      {/* Background orbs */}
      <div style={{ position: "absolute", top: -120, right: -120, width: 400, height: 400, borderRadius: "50%", background: "rgba(83,74,183,0.12)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(83,74,183,0.08)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "40%", left: "15%", width: 6, height: 6, borderRadius: "50%", background: "rgba(175,169,236,0.4)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "20%", right: "20%", width: 4, height: 4, borderRadius: "50%", background: "rgba(175,169,236,0.3)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, justifyContent: "center" }}>
          <div style={{ width: 40, height: 40, background: "#534AB7", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="ti ti-shield-check" style={{ color: "#fff", fontSize: 20 }} />
          </div>
          <div>
            <div style={{ color: "#fff", fontSize: 17, fontWeight: 600, lineHeight: 1.2 }}>SupportNest</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Customer Support Platform</div>
          </div>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 36, border: "0.5px solid rgba(255,255,255,0.1)" }}>
          {children}
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 20 }}>
          © 2025 SupportNest. All rights reserved.
        </p>
      </div>
    </div>
  )
}

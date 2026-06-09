"use client"

import React from "react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 font-sans bg-[#f6f5fc]">
      {/* Left side: Pure Branding/Marketing (Hidden on mobile) */}
      <div className="hidden lg:flex lg:col-span-5 bg-[#1a1830] p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute pointer-events-none rounded-full top-[-10%] right-[-10%] w-[300px] h-[300px] bg-[#534AB7]/10 blur-3xl" />
        <div className="absolute pointer-events-none rounded-full bottom-[-10%] left-[-10%] w-[250px] h-[250px] bg-[#4F46E5]/10 blur-3xl" />
        
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 no-underline relative z-10">
          <div className="w-9 h-9 bg-[#534AB7] rounded-[10px] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-white text-[17px] font-bold tracking-tight">SupportNest</span>
        </a>

        {/* Dynamic Value Prop */}
        <div className="relative z-10 my-auto max-w-sm">
          <h2 className="text-white text-3xl font-extrabold tracking-tight leading-tight mb-4">
            Resolve tickets instantly with AI agents.
          </h2>
          <p className="text-white/60 text-sm leading-relaxed">
            Join thousands of modern support teams utilizing automated intent detection, instant multi-step troubleshooting, and seamless human handoffs.
          </p>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-white/30 text-xs">
          © 2026 SupportNest. All rights reserved.
        </div>
      </div>

      {/* Right side: Content wrapper containing Login / Register forms */}
      <div className="col-span-1 lg:col-span-7 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[440px] bg-white rounded-2xl border border-[#e8e6f0] p-8 sm:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          {children}
        </div>
      </div>
    </div>
  )
}
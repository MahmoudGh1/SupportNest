"use client"

import Link from "next/link"
import { useInView } from "@/hooks/useInView"

export default function CtaBanner() {
  const { ref, visible } = useInView()

  return (
    <section className="py-20 px-[5%] bg-white">
      <div
        ref={ref}
        className="max-w-[900px] mx-auto rounded-3xl px-10 py-[60px] text-center relative overflow-hidden shadow-[0_24px_80px_rgba(83,74,183,0.35)]"
        style={{
          background: "linear-gradient(135deg, #534AB7 0%, #4F46E5 100%)",
          opacity:    visible ? 1 : 0,
          transform:  visible ? "scale(1)" : "scale(0.97)",
          transition: "all .6s ease",
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-[60px] -left-[60px] w-[240px] h-[240px] rounded-full bg-white/5 pointer-events-none" />

        <div className="text-xs text-white/60 font-bold tracking-[.1em] uppercase mb-[18px]">
          Get started today
        </div>
        <h2
          className="font-extrabold text-white tracking-[-0.025em] mt-0 mb-3.5"
          style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}
        >
          Ready to resolve 80% of tickets instantly?
        </h2>
        <p className="text-base text-white/75 mb-9">
          No credit card required. Up and running in minutes.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/register"
            className="bg-white text-[#534AB7] text-[15px] font-bold no-underline px-[30px] py-[13px] rounded-[10px] hover:bg-[#EEEDFE] hover:-translate-y-0.5 transition-all duration-200"
          >
            Start Free Trial
          </Link>
          <Link
            href="/login"
            className="bg-transparent text-white text-[15px] font-semibold no-underline px-7 py-[13px] rounded-[10px] border-[1.5px] border-white/35 hover:border-white/70 transition-all duration-200"
          >
            Sign In
          </Link>
        </div>
      </div>
    </section>
  )
}
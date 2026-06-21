"use client";

import { useRouter } from "next/navigation";
import { OnboardingEmptyState } from "@/components/Onboardingempty";

export default function OverviewPage() {
  const router = useRouter();

  return (
    <OnboardingEmptyState
      onNavigate={(page) =>
        router.push(page === "dashboard" ? "/dashboard" : `/dashboard/${page}`)
      }
    />
  );
}
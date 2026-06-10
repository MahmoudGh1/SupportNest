"use client";
import Navbar from "@/components/Navbar";
import PricingCards from "@/components/pricing/PricingCard";
import PricingFAQ from "@/components/pricing/PricingFag";
import PricingHero from "@/components/pricing/PricingHero";
import PricingTable from "@/components/pricing/PricingTable";
import { useState } from "react";

function PricingClient() {
  const [annual, setAnnual] = useState(true);
  return (
    <>
      <div className="min-h-screen bg-white font-sans">
        <Navbar />
        <PricingHero annual={annual} setAnnual={setAnnual} />
        <PricingCards annual={annual} />
        <PricingTable />
        <PricingFAQ />
      </div>
    </>
  );
}

export default PricingClient;

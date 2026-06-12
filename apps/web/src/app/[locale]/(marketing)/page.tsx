"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Hero from "@/components/landingPage/Hero";
import { Trans, useLingui } from "@lingui/react/macro";

const Pipeline = dynamic(() => import("@/components/landingPage/Pipeline"));
const Features = dynamic(() => import("@/components/landingPage/Features"));
const CustomerStories = dynamic(
	() => import("@/components/landingPage/Customerstories"),
);
const About = dynamic(() => import("@/components/landingPage/About"));
const Contact = dynamic(() => import("@/components/landingPage/Contact"));
const CtaBanner = dynamic(() => import("@/components/landingPage/Ctabanner"));
const Footer = dynamic(() => import("@/components/landingPage/Footer"));

function PricingTeaser() {
	const { t } = useLingui();
	return (
		<section
			id="pricing"
			className="py-20 px-[5%] text-center sn-surface border-y"
			style={{ background: "var(--surface-elevated)" }}
		>
			<h2 className="text-3xl font-bold mb-3 mt-0">
				<Trans>Simple, transparent pricing</Trans>
			</h2>
			<p className="sn-muted mb-8 max-w-md mx-auto">
				<Trans>Start free. No credit card required.</Trans>
			</p>
			<Link
				href="/pricing"
				className="inline-flex items-center gap-2 no-underline px-8 py-3 rounded-[10px] text-[15px] font-semibold text-white bg-brand hover:bg-brand-light transition-colors"
			>
				{t`View plans`} <i className="ti ti-arrow-right" />
			</Link>
		</section>
	);
}

export default function LandingPage() {
	return (
		<div className="overflow-x-hidden">
			<Hero />
			<Pipeline />
			<Features />
			<CustomerStories />
			<PricingTeaser />
			<About />
			<Contact />
			<CtaBanner />
			<Footer />
		</div>
	);
}

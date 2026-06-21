import prisma from "src/config/prisma.js";

async function main() {
	console.log("🌱 Start seeding subscription plans...");

	const FEATURE_LABELS: Record<string, string> = {
		members: "Team Members",
		customerIntegrations: "Customer Integrations",
		tiers: "Support Tiers",
		humanAgentInbox: "Human Agent Inbox",
		embeddableChatWidget: "Embeddable Chat Widget",
		customWidgetBranding: "Custom Widget Branding",
		customThemes: "Custom Themes",
		dedicatedInfrastructure: "Dedicated Infrastructure",
		analyticsDashboard: "Analytics Dashboard",
		csatScores: "CSAT Scores",
		apiAccess: "API Access",
		emailSupport: "Email Support",
		prioritySupport: "Priority Support",
		slaAndUptimeGuarantee: "SLA & Uptime Guarantee",
		dedicatedAccountManager: "Dedicated Account Manager",
	};

	function buildFeatureList(features: Record<string, unknown>): string[] {
		return Object.entries(features)
			.filter(([, value]) => value !== false && value !== null) // exclude false/null
			.map(([key, value]) => {
				const label = FEATURE_LABELS[key] ?? key;
				if (typeof value === "boolean") return label; // key name only
				if (Array.isArray(value)) return `${label}: ${value.join(", ")}`;
				return `${label}: ${value}`;
			});
	}

	const rawPlans = [
		{
			id: "64a73f0d-cd51-43d5-b412-7f9346b1b922",
			name: "Starter",
			price: 29,
			// interval: "month",
			maxConversations: 50,
			maxAgents: 1,
			maxKnowledgeDocuments: 10,
			features: {
				members: 3,
				customerIntegrations: false,
				tiers: ["Tier 1"],
				humanAgentInbox: false,
				embeddableChatWidget: true,
				customWidgetBranding: false,
				customThemes: false,
				dedicatedInfrastructure: false,
				analyticsDashboard: "basic",
				csatScores: false,
				apiAccess: false,
				emailSupport: true,
				prioritySupport: false,
				slaAndUptimeGuarantee: false,
				dedicatedAccountManager: false,
			},
		},
		{
			id: "9be5b35b-ee88-4745-9836-f3e18eadb8a7",
			name: "Pro",
			price: 79,
			// interval: "month",
			maxConversations: null,
			maxAgents: 2,
			maxKnowledgeDocuments: 50,
			features: {
				members: 15,
				customerIntegrations: false,
				tiers: ["Tier 1", "Tier 2"],
				humanAgentInbox: true,
				embeddableChatWidget: true,
				customWidgetBranding: true,
				customThemes: false,
				dedicatedInfrastructure: false,
				analyticsDashboard: "advanced",
				csatScores: true,
				apiAccess: true,
				emailSupport: true,
				prioritySupport: true,
				slaAndUptimeGuarantee: false,
				dedicatedAccountManager: false,
			},
		},
		{
			id: "84ae4a6e-9ea8-44e7-a1e4-3c51172cdaaf",
			name: "Enterprise",
			price: null,
			// interval: "custom",
			maxConversations: null,
			maxAgents: null,
			maxKnowledgeDocuments: null,
			features: {
				members: null,
				customerIntegrations: true,
				tiers: ["Full pipeline"], // was a bare string before — now consistent w/ array type
				humanAgentInbox: true,
				embeddableChatWidget: true,
				customWidgetBranding: true,
				customThemes: true,
				dedicatedInfrastructure: true,
				analyticsDashboard: "advanced",
				csatScores: true,
				apiAccess: true,
				emailSupport: true,
				prioritySupport: true,
				slaAndUptimeGuarantee: true,
				dedicatedAccountManager: true,
			},
		},
	];

	const plans = rawPlans.map((plan) => ({
		...plan,
		features: JSON.stringify(buildFeatureList(plan.features)),
	}));

	for (const plan of plans) {
		await prisma.pricing.upsert({
			where: { id: plan.id },
			update: {
				name: plan.name,
				priceMonthly: Number(plan.price),
				maxConversations: plan.maxConversations,
				maxAgents: plan.maxAgents,
				maxKnowledgeDocuments: plan.maxKnowledgeDocuments,
				features: plan.features,
			},
			create: {
				id: plan.id,
				name: plan.name,
				priceMonthly: Number(plan.price),
				maxConversations: plan.maxConversations,
				maxAgents: plan.maxAgents,
				maxKnowledgeDocuments: plan.maxKnowledgeDocuments,
				features: plan.features,
			},
		});
	}

	console.log("✅ Seeding subscription plans finished.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});

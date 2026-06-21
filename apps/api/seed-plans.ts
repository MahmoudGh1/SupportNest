import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Start seeding subscription plans...");

	const plans = [
		{
			id: "64a73f0d-cd51-43d5-b412-7f9346b1b922", // Hardcoded unique identifier
			name: "Starter",
			price: 29,
			interval: "month",
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
			interval: "month",
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
			interval: "custom",
			maxConversations: null,
			maxAgents: null,
			maxKnowledgeDocuments: null,
			features: {
				members: null,
				customerIntegrations: true,
				tiers: "Full pipeline",
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

	for (const plan of plans) {
		await prisma.plan.upsert({
			where: { id: plan.id },
			update: {
				name: plan.name,
				price: plan.price,
			},
			create: plan,
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

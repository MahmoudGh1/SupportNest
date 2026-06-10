import prisma from "src/config/prisma.js";

export const getActivePlansService = async (): Promise<
  Array<{
    id: string;
    name: string;
    priceMonthly: number;
    maxConversations: number;
    maxAgents: number;
    maxKnowledgeDocuments: number;
    features: string;
  }>
> => {
  const plans = await prisma.pricing.findMany({
    where: { isActive: true },
    orderBy: { priceMonthly: "asc" },
    select: {
      id: true,
      name: true,
      priceMonthly: true,
      maxConversations: true,
      maxAgents: true,
      maxKnowledgeDocuments: true,
      features: true,
    },
  });

  return plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    priceMonthly: plan.priceMonthly.toNumber(),
    maxConversations: plan.maxConversations ?? 0,
    maxAgents: plan.maxAgents ?? 0,
    maxKnowledgeDocuments: plan.maxKnowledgeDocuments ?? 0,
    features: String(plan.features),
  }));
};

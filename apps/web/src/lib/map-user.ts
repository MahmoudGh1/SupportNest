import type { AuthUser } from "@/types/types";

export function mapApiUser(result: {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: string;
	organizationId?: string | null;
	organizationName?: string | null;
	onboarded?: boolean;
	hasActiveSubscription?: boolean;
}): AuthUser {
	return {
		id: result.id,
		email: result.email,
		firstName: result.firstName,
		lastName: result.lastName,
		role: result.role as AuthUser["role"],
		orgId: result.organizationId ?? null,
		orgName: result.organizationName ?? undefined,
		onboarded: result.onboarded ?? Boolean(result.organizationId),
		hasActiveSubscription: result.hasActiveSubscription ?? false,
	};
}

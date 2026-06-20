import prisma from "src/config/prisma.js";
import * as widgetServerSdk from "src/config/widget-server-sdk.js";

const resolveCustomerFromRequest = async function ({
	organizationId,
	widgetSecret,
	customerJwt,
	visitorId,
}: {
	organizationId: string;
	widgetSecret: string;
	customerJwt: string;
	visitorId: string;
}) {
	if (customerJwt) {
		let customerPayload: any = await widgetServerSdk.verifyToken(
			widgetSecret,
			customerJwt,
			(err: any) => {
				throw new Error(err.message || "Invalid customerJwt");
			},
		);

		const { userId, email } = customerPayload;

		return prisma.customer.upsert({
			where: {
				organizationId_externalId: {
					organizationId: organizationId,
					externalId: userId,
				},
			},
			update: {
				email: email ?? undefined,
			},
			create: {
				organizationId: organizationId,
				externalId: userId,
				email: email ?? null,
				name: null,
				isAnonymous: false,
			},
		});
	}

	if (!visitorId) {
		throw new Error("Missing visitorId for anonymous customer");
	}

	return prisma.customer.upsert({
		where: {
			organizationId_externalId: {
				organizationId: organizationId,
				externalId: visitorId ?? `anon_fallback_${Date.now()}`,
			},
		},
		update: {},
		create: {
			organizationId: organizationId,
			externalId: visitorId,
			isAnonymous: true,
		},
	});
};

export default resolveCustomerFromRequest;

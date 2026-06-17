import prisma from "src/config/prisma.js";
import AppError from "src/utils/appError.js";
import { comparePassword, hashPassword } from "src/utils/password.util.js";

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
export async function updateProfileService(userId: string, data: { firstName: string; lastName: string; email: string }) {
	// Check email not taken by another user
	if (data.email) {
		const existing = await prisma.user.findUnique({
			where: { email: data.email },
		});
		if (existing && existing.id !== userId) {
			throw new AppError("Email already in use by another account.", 409);
		}
	}

	const updated = await prisma.user.update({
		where: { id: userId },
		data: {
			firstName: data.firstName,
			lastName: data.lastName,
			email: data.email,
		},
		select: {
			id: true,
			email: true,
			firstName: true,
			lastName: true,
			role: true,
			organizationId: true,
			isActive: true,
			createdAt: true,
			updatedAt: true,
			isEmailVerified: true
		},
	});

	return updated;
}

// ─── UPDATE PASSWORD ──────────────────────────────────────────────────────────
export async function updatePasswordService(userId: string, currentPassword: string, newPassword: string) {
	// 1. Fetch user with password hash
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { id: true, passwordHash: true },
	});

	if (!user) throw new AppError("User not found.", 404);

	// 2. Verify current password
	const isMatch = await comparePassword(currentPassword, user.passwordHash);
	if (!isMatch) throw new AppError("Current password is incorrect.", 401);

	// 3. Validate new password length
	if (newPassword.length < 8) {
		throw new AppError("New password must be at least 8 characters.", 400);
	}

	// 4. Hash and save
	const passwordHash = await hashPassword(newPassword);
	await prisma.user.update({
		where: { id: userId },
		data: { passwordHash },
	});

	return { success: true };
}

export async function deleteAccountService(userId: string, fullName: string, orgName: string) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			firstName: true,
			lastName: true,
			organizationId: true,
			organization: { select: { name: true } },
		},
	});

	if (!user) throw new AppError("User not found.", 404);

	const expectedFullName = `${user.firstName} ${user.lastName}`.trim();
	if (fullName.trim() !== expectedFullName) {
		throw new AppError("Name does not match.", 400);
	}
	if (!user.organization || orgName.trim() !== user.organization.name) {
		throw new AppError("Organization name does not match.", 400);
	}

	const organizationId = user.organizationId;

	const otherUsersCount = organizationId ? await prisma.user.count({ where: { organizationId: organizationId, id: { not: userId } } }) : 0;
	const isLastUser = organizationId !== null && otherUsersCount === 0;

	const ownedDocs = await prisma.knowledgeDocument.count({ where: { createdById: userId } });
	let fallbackAdminId: string | null = null;
	if (ownedDocs > 0 && !isLastUser) {
		const fallbackAdmin = await prisma.user.findFirst({
			where: { organizationId: organizationId, role: "ORG_ADMIN", id: { not: userId } },
			select: { id: true },
		});
		if (!fallbackAdmin) {
			throw new AppError("Cannot delete account: you have uploaded knowledge documents and no other admin exists to reassign them to. Please transfer or delete them first.", 409);
		}
		fallbackAdminId = fallbackAdmin.id;
	}

	await prisma.$transaction(async (tx) => {
		if (isLastUser && organizationId) {
			const conversations = await tx.conversation.findMany({
				where: { organizationId: organizationId },
				select: { id: true },
			});
			const conversationIds = conversations.map((c) => c.id);

			if (conversationIds.length > 0) {
				await tx.message.deleteMany({ where: { conversationId: { in: conversationIds } } });
				await tx.agentLog.deleteMany({ where: { conversationId: { in: conversationIds } } });
				await tx.report.deleteMany({ where: { conversationId: { in: conversationIds } } });
				await tx.csatRating.deleteMany({ where: { conversationId: { in: conversationIds } } });
				await tx.conversationAnalytics.deleteMany({ where: { conversationId: { in: conversationIds } } });
				await tx.ticket.deleteMany({ where: { conversationId: { in: conversationIds } } });
			}
			await tx.conversation.deleteMany({ where: { organizationId: organizationId } });

			await tx.ticket.deleteMany({ where: { organizationId: organizationId } });

			await tx.documentChunk.deleteMany({ where: { organizationId: organizationId } });

			await tx.toolDefinition.deleteMany({ where: { organizationId: organizationId } });

			await tx.knowledgeDocument.deleteMany({ where: { organizationId: organizationId } });

			await tx.businessApiConfig.deleteMany({ where: { organizationId: organizationId } });

			await tx.csatRating.deleteMany({ where: { organizationId: organizationId } });
			await tx.conversationAnalytics.deleteMany({ where: { organizationId: organizationId } });

			await tx.customer.deleteMany({ where: { organizationId: organizationId } });
			await tx.apiKey.deleteMany({ where: { organizationId: organizationId } });

			await tx.payment.deleteMany({ where: { organizationId: organizationId } });
			await tx.invitation.deleteMany({ where: { organizationId: organizationId } });

			await tx.user.delete({ where: { id: userId } });
			await tx.organization.delete({ where: { id: organizationId } });
		} else {
			await tx.ticket.updateMany({
				where: { assignedToId: userId },
				data: { assignedToId: null },
			});

			if (ownedDocs > 0 && fallbackAdminId) {
				await tx.knowledgeDocument.updateMany({
					where: { createdById: userId },
					data: { createdById: fallbackAdminId },
				});
			}

			await tx.invitation.deleteMany({ where: { invitedById: userId } });

			await tx.user.delete({ where: { id: userId } });
		}
	});

	return { success: true };
}

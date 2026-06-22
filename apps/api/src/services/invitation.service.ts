import prisma from "src/config/prisma.js";
import crypto from "crypto";
import AppError from "src/utils/appError.js";
import { sendInvitationEmail, sendRevocationEmail } from "src/config/mailer.js";
import { InvitationStatus, Role } from "generated/prisma/enums.js";
import { generateInviteToken } from "src/utils/crypto.utils.js";
import { enqueueNotification } from "src/queues/notification.queue.js";

function sevenDaysFromNow(): Date {
	return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

export async function sendInvitationService(organizationId: string, invitedById: string, email: string): Promise<void> {
	const org = await prisma.organization.findUnique({
		where: { id: organizationId },
		include: { plan: { select: { name: true, maxAgents: true } } },
	});
	if (!org) throw new AppError("Organization not found", 404);

	const inviter = await prisma.user.findUnique({
		where: { id: invitedById },
	});
	if (!inviter) throw new AppError("Inviter not found", 404);

	const existingUser = await prisma.user.findFirst({
		where: { email, organizationId },
	});
	if (existingUser) {
		throw new AppError("This email is already a member of your organization", 409);
	}

	const maxAgents = org.plan.maxAgents;

	if (maxAgents !== null) {
		const [activeAgentCount, pendingInvitationCount] = await Promise.all([
			prisma.user.count({
				where: {
					organizationId,
					role: Role.SUPPORT_AGENT,
					isActive: true,
				},
			}),
			prisma.invitation.count({
				where: {
					organizationId,
					status: InvitationStatus.PENDING,
					expiresAt: { gt: new Date() },
				},
			}),
		]);

		const usedSeats = activeAgentCount + pendingInvitationCount;

		if (usedSeats >= maxAgents) {
			throw new AppError(`Your ${org.plan.name} plan allows up to ${maxAgents} support agents. Revoke an existing invitation or upgrade your plan to invite more.`, 403);
		}
	}

	await prisma.invitation.updateMany({
		where: {
			email,
			organizationId,
			status: InvitationStatus.PENDING,
		},
		data: {
			status: InvitationStatus.EXPIRED,
		},
	});

	const token = generateInviteToken();
	console.log("1. Organization found");

	console.log("2. Creating invitation");

	await prisma.invitation.create({
		data: {
			organizationId,
			invitedById,
			email,
			token,
			role: Role.SUPPORT_AGENT,
			status: InvitationStatus.PENDING,
			expiresAt: sevenDaysFromNow(),
		},
	});
	console.log("3. Invitation created");

	console.log("4. Sending email");

	const inviterName = `${inviter.firstName} ${inviter.lastName}`;
	// await sendInvitationEmail(email, org.name, inviterName, token)
	sendInvitationEmail(email, org.name, inviterName, token).catch((err) => {
		console.error("Invitation email failed:", err);
	});
	console.log("5. Email sent");
}

export async function validateInvitationService(token: string) {
	const invitation = await prisma.invitation.findUnique({
		where: { token },
		include: { organization: true },
	});

	if (!invitation) throw new AppError("Invalid invitation link", 404);
	if (invitation.status === InvitationStatus.ACCEPTED) throw new AppError("This invitation has already been used", 410);
	if (invitation.status === InvitationStatus.EXPIRED) throw new AppError("This invitation has expired", 410);
	if (invitation.expiresAt < new Date()) {
		await prisma.invitation.update({
			where: { id: invitation.id },
			data: { status: InvitationStatus.EXPIRED },
		});
		throw new AppError("This invitation has expired", 410);
	}

	const DTO = {
		email: invitation.email,
		orgName: invitation.organization.name,
		role: invitation.role,
	};

	return DTO;
}

export async function acceptInvitationService(token: string, firstName: string, lastName: string, password: string) {
	const invitation = await prisma.invitation.findUnique({
		where: { token },
		include: {
			organization: true,
			invitedBy: true,
		},
	});

	if (!invitation) throw new AppError("Invalid invitation link", 404);
	if (invitation.status !== InvitationStatus.PENDING) throw new AppError("This invitation is no longer valid", 410);
	if (invitation.expiresAt < new Date()) {
		await prisma.invitation.update({
			where: { id: invitation.id },
			data: { status: InvitationStatus.EXPIRED },
		});
		throw new AppError("This invitation has expired", 410);
	}

	const existing = await prisma.user.findUnique({
		where: { email: invitation.email },
	});
	if (existing) throw new AppError("An account with this email already exists", 409);

	const { hashPassword } = await import("src/utils/password.util.js");
	const passwordHash = await hashPassword(password);

	const inviterName = invitation.invitedBy ? `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}` : invitation.email;

	const user = await prisma.$transaction(async (tx) => {
		const newUser = await tx.user.create({
			data: {
				email: invitation.email,
				passwordHash,
				firstName,
				lastName,
				role: invitation.role,
				organizationId: invitation.organizationId,
				isActive: true,
				isEmailVerified: true,
				emailVerifiedAt: new Date(),
			},
		});

		await tx.invitation.update({
			where: { id: invitation.id },
			data: {
				status: InvitationStatus.ACCEPTED,
				acceptedAt: new Date(),
			},
		});

		//notification service
		await enqueueNotification("user_added", {
			organizationId: invitation.organizationId,
			organizationName: invitation.organization?.name ?? "",
			addedByName: inviterName,
			role: newUser.role,
		});

		return newUser;
	});

	return {
		message: "Account created successfully. You can now log in.",
		email: user.email,
	};
}

export async function getTeamService(organizationId: string) {
	const [members, pendingInvitations, ticketCounts] = await Promise.all([
		prisma.user.findMany({
			where: { organizationId },
			select: {
				id: true,
				firstName: true,
				lastName: true,
				email: true,
				role: true,
				isActive: true,
				scheduledDeletionAt: true,
				createdAt: true,
			},
			orderBy: { createdAt: "asc" },
		}),
		prisma.invitation.findMany({
			where: {
				organizationId,
				status: InvitationStatus.PENDING,
				expiresAt: { gt: new Date() },
			},
			select: {
				id: true,
				email: true,
				role: true,
				status: true,
				createdAt: true,
				expiresAt: true,
				invitedBy: {
					select: { firstName: true, lastName: true },
				},
			},
			orderBy: { createdAt: "desc" },
		}),
		prisma.ticket.groupBy({
			by: ["assignedToId", "status"],
			where: { organizationId, assignedToId: { not: null } },
			_count: true,
		}),
	]);

	const membersWithStats = members.map((member) => {
		const rows = ticketCounts.filter((t) => t.assignedToId === member.id);
		const resolved = rows.find((t) => t.status === "RESOLVED")?._count ?? 0;
		const open = rows.find((t) => t.status === "OPEN")?._count ?? 0;
		const inProgress = rows.find((t) => t.status === "IN_PROGRESS")?._count ?? 0;

		return {
			...member,
			ticketStats: {
				totalAssigned: resolved + open + inProgress,
				resolved,
				unresolved: open + inProgress,
			},
		};
	});

	return { members: membersWithStats, pendingInvitations };
}

export async function revokeInvitationService(invitationId: string, organizationId: string): Promise<void> {
	const invitation = await prisma.invitation.findUnique({
		where: { id: invitationId },
		include: { organization: true, invitedBy: true },
	});

	if (!invitation || invitation.organizationId !== organizationId) {
		throw new AppError("Invitation not found", 404);
	}

	if (invitation.status !== InvitationStatus.PENDING) {
		throw new AppError("Only pending invitations can be revoked", 400);
	}

	await prisma.invitation.update({
		where: { id: invitationId },
		data: { status: InvitationStatus.EXPIRED },
	});

	const inviterName = invitation.invitedBy ? `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}` : invitation.email;

	await enqueueNotification("user_deleted", {
		organizationId: invitation.organizationId,
		organizationName: invitation.organization?.name ?? "",
		deletedByName: inviterName,
	});

	// await sendRevocationEmail(invitation.email, invitation.organization.name)
	sendRevocationEmail(invitation.email, invitation.organization.name).catch(console.error);
	return;
}

export async function acceptInvitationWithGoogleService(token: string, googleEmail: string, name: string) {
	const invitation = await prisma.invitation.findUnique({ where: { token } });

	if (!invitation) throw new AppError("Invalid invitation link", 404);
	if (invitation.status !== InvitationStatus.PENDING) throw new AppError("This invitation is no longer valid", 410);
	if (invitation.expiresAt < new Date()) {
		await prisma.invitation.update({ where: { id: invitation.id }, data: { status: InvitationStatus.EXPIRED } });
		throw new AppError("This invitation has expired", 410);
	}

	if (invitation.email.toLowerCase() !== googleEmail.toLowerCase()) {
		throw new AppError("This Google account does not match the invited email address", 403);
	}

	const existing = await prisma.user.findUnique({ where: { email: invitation.email } });
	if (existing) throw new AppError("An account with this email already exists", 409);

	const nameParts = name.trim().split(" ");
	const firstName = nameParts[0] ?? "";
	const lastName = nameParts.slice(1).join(" ") ?? "";

	await prisma.$transaction(async (tx) => {
		await tx.user.create({
			data: {
				email: invitation.email,
				passwordHash: "",
				firstName,
				lastName,
				role: invitation.role,
				organizationId: invitation.organizationId,
				isActive: true,
				isEmailVerified: true,
				emailVerifiedAt: new Date(),
			},
		});

		await tx.invitation.update({
			where: { id: invitation.id },
			data: { status: InvitationStatus.ACCEPTED, acceptedAt: new Date() },
		});
	});

	return {
		message: "Account created successfully. You can now log in.",
		email: invitation.email,
	};
}

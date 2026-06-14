import prisma from "src/config/prisma.js";
import crypto from "crypto";
import AppError from "src/utils/appError.js";
import { sendInvitationEmail, sendRevocationEmail } from "src/config/mailer.js";
import { InvitationStatus, Role } from "generated/prisma/enums.js";
import { generateInviteToken } from "src/utils/crypto.utils.js";


function sevenDaysFromNow(): Date {
	return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}


export async function sendInvitationService(organizationId: string, invitedById: string, email: string): Promise<void> {
	const org = await prisma.organization.findUnique({
		where: { id: organizationId },
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

	const inviterName = `${inviter.firstName} ${inviter.lastName}`;
	sendInvitationEmail(email, org.name, inviterName, token)
		.then(() => {
			console.log(`[Invitation] Email sent successfully to ${email}`);
		})
		.catch((err) => {
			console.error(`[Invitation] Failed to send email to ${email}:`, err);
		});
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
		organizationName: invitation.organization.name,
		role: invitation.role,
    }

	return DTO;
}


export async function acceptInvitationService(token: string, firstName: string, lastName: string, password: string) {
	const invitation = await prisma.invitation.findUnique({
		where: { token },
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
			},
		});

		await tx.invitation.update({
			where: { id: invitation.id },
			data: {
				status: InvitationStatus.ACCEPTED,
				acceptedAt: new Date(),
			},
		});

		return newUser;
	});

	return {
		message: "Account created successfully. You can now log in.",
		email: user.email,
	};
}


export async function getTeamService(organizationId: string) {
	const [members, pendingInvitations] = await Promise.all([
		prisma.user.findMany({
			where: { organizationId },
			select: {
				id: true,
				firstName: true,
				lastName: true,
				email: true,
				role: true,
				isActive: true,
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
	]);

	return { members, pendingInvitations };
}


export async function revokeInvitationService(invitationId: string, organizationId: string): Promise<void> {
    const invitation = await prisma.invitation.findUnique({
        where: { id: invitationId },
        include: { organization: true },
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

    sendRevocationEmail(invitation.email, invitation.organization.name)
        .then(() => {
            console.log(`[Revocation] Email sent successfully to ${invitation.email}`);
        })
        .catch((err) => {
            console.error(`[Revocation] Failed to send revocation email to ${invitation.email}:`, err);
        });
}

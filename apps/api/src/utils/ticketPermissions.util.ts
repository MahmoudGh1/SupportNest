import AppError from "src/utils/appError.js";

type Actor = {
	id: string;
	role: "SUPER_ADMIN" | "ORG_ADMIN" | "SUPPORT_AGENT";
};
type ExistingTicket = { assignedToId: string | null };
type UpdateInput = {
	status?: unknown;
	priority?: unknown;
	resolutionNote?: unknown;
	assignedToId?: string | null;
};

function isAdmin(actor: Actor): boolean {
	return actor.role === "ORG_ADMIN" || actor.role === "SUPER_ADMIN";
}

export function assertCanUpdateTicket(
	existing: ExistingTicket,
	actor: Actor,
	input: UpdateInput,
): void {
	const admin = isAdmin(actor);
	const isCurrentAssignee = existing.assignedToId === actor.id;
	console.log("existing assignedId");
	console.log(existing.assignedToId);
	console.log("input assignedId");
	console.log(input.assignedToId);
	console.log("actor id");
	console.log(actor.id);
	// Assignment changes have their own rules, separate from status/priority/resolution
	if (input.assignedToId !== undefined) {
		const isClaimingUnassigned =
			existing.assignedToId === null && input.assignedToId === actor.id;
		if (!isClaimingUnassigned && !admin) {
			throw new AppError(
				"Only an organization admin can reassign or unassign a ticket.",
				403,
			);
		}
	}

	// Status / priority / resolution: only the current assignee or an admin
	const touchesWorkFields =
		input.status !== undefined ||
		input.priority !== undefined ||
		input.resolutionNote !== undefined;

	if (touchesWorkFields && !isCurrentAssignee && !admin) {
		throw new AppError(
			"Only the assigned agent or an admin can update this ticket.",
			403,
		);
	}
}

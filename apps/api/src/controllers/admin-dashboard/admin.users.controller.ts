import type { Response } from "express";

import {
  parsePagination,
  buildPaginatedResponse,
  notFound,
  badRequest,
  sendError,
} from "../../utils/helpers.js";
import type { AuthenticatedRequest } from "src/types/auth.types.js";
import prisma from "src/config/prisma.js";
import {
  createUser,
  deleteUser,
  getUserById,
  listUsersForOrg,
  updateUser,
} from "src/services/admin-dashboard/user.service.js";

function getStringParam(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

// GET /admin/organizations/:organizationId/users
export async function getOrgUsers(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const organizationId = getStringParam(req.params.organizationId);
  if (!organizationId) {
    badRequest(res, "Organization id is required.");
    return;
  }

  const { page, limit, skip } = parsePagination(req.query);
  const role = getStringParam(req.query.role);
  const isActiveParam = getStringParam(req.query.is_active);
  const is_active =
    isActiveParam === undefined ? undefined : isActiveParam === "true";

  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) {
    notFound(res, "Organization");
    return;
  }

  const opts: {
    page: number;
    limit: number;
    skip: number;
    role?: string;
    is_active?: boolean;
  } = { page, limit, skip };
  if (role) opts.role = role;
  if (is_active !== undefined) opts.is_active = is_active;

  const { data, total } = await listUsersForOrg(organizationId, opts);
  res.json(buildPaginatedResponse(data, total, page, limit));
}

// GET /admin/organizations/:organizationId/users/:userId
export async function getOrgUser(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const organizationId = getStringParam(req.params.organizationId);
  const userId = getStringParam(req.params.userId);

  if (!organizationId) {
    badRequest(res, "Organization id is required.");
    return;
  }
  if (!userId) {
    badRequest(res, "User id is required.");
    return;
  }

  const user = await getUserById(userId, organizationId);
  if (!user) {
    notFound(res, "User");
    return;
  }
  res.json(user);
}

// POST /admin/organizations/:organizationId/users
export async function createOrgUser(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const organizationId = getStringParam(req.params.organizationId);
  const { email, password, first_name, last_name, role } = req.body;

  if (!organizationId) {
    badRequest(res, "Organization id is required.");
    return;
  }
  if (!email || !password || !first_name || !last_name || !role) {
    badRequest(
      res,
      "email, password, first_name, last_name, and role are required.",
    );
    return;
  }

  if (!["org_admin", "support_agent"].includes(role)) {
    badRequest(res, "role must be org_admin or support_agent.");
    return;
  }

  if (password.length < 8) {
    badRequest(res, "password must be at least 8 characters.");
    return;
  }

  const result = await createUser({
    email,
    password,
    first_name,
    last_name,
    role,
    organization_id: organizationId,
  });

  if (result.error === "ORGANIZATION_NOT_FOUND") {
    notFound(res, "Organization");
    return;
  }
  if (result.error === "EMAIL_ALREADY_EXISTS") {
    sendError(
      res,
      409,
      "EMAIL_ALREADY_EXISTS",
      "A user with this email already exists.",
    );
    return;
  }

  res.status(201).json(result.data);
}

// PATCH /admin/organizations/:organizationId/users/:userId
export async function updateOrgUser(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const organizationId = getStringParam(req.params.organizationId);
  const userId = getStringParam(req.params.userId);
  const { first_name, last_name, role, is_active } = req.body;

  if (!organizationId) {
    badRequest(res, "Organization id is required.");
    return;
  }
  if (!userId) {
    badRequest(res, "User id is required.");
    return;
  }

  if (role && !["org_admin", "support_agent"].includes(role)) {
    badRequest(res, "role must be org_admin or support_agent.");
    return;
  }

  const result = await updateUser(
    userId,
    { first_name, last_name, role, is_active },
    organizationId,
  );
  if (result.error === "USER_NOT_FOUND") {
    notFound(res, "User");
    return;
  }
  res.json(result.data);
}

// DELETE /admin/organizations/:organizationId/users/:userId  (soft delete)
export async function removeOrgUser(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const organizationId = getStringParam(req.params.organizationId);
  const userId = getStringParam(req.params.userId);

  if (!organizationId) {
    badRequest(res, "Organization id is required.");
    return;
  }
  if (!userId) {
    badRequest(res, "User id is required.");
    return;
  }

  // Prevent self-removal
  if (req.user?.sub === userId) {
    sendError(
      res,
      400,
      "CANNOT_REMOVE_SELF",
      "You cannot remove your own account.",
    );
    return;
  }

  const result = await deleteUser(userId, organizationId);
  if (result.error === "USER_NOT_FOUND") {
    notFound(res, "User");
    return;
  }
  res.json({ message: "User deactivated and unassigned from open tickets." });
}

// GET /admin/users  (all users, super admin only)
export async function getAllUsers(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { page, limit, skip } = parsePagination(req.query);
  const role = getStringParam(req.query.role);
  const isActiveParam = getStringParam(req.query.is_active);
  const is_active =
    isActiveParam === undefined ? undefined : isActiveParam === "true";
  const search = getStringParam(req.query.search);

  const where = {
    role: { not: "SUPER_ADMIN" as const },
    ...(role ? { role: role as any } : {}),
    ...(is_active !== undefined ? { isActive: is_active } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        organizationId: true,
        createdAt: true,
        organization: { select: { id: true, name: true, slug: true } },
        _count: { select: { assignedTickets: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const data = users.map((u) => ({
    id: u.id,
    email: u.email,
    first_name: u.firstName,
    last_name: u.lastName,
    role: u.role,
    is_active: u.isActive,
    organization: u.organization ?? null,
    created_at: u.createdAt.toISOString(),
    assigned_tickets_count: u._count.assignedTickets,
  }));

  res.json(buildPaginatedResponse(data, total, page, limit));
}

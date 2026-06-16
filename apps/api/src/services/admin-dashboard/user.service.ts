import bcrypt from "bcrypt";
import prisma from "src/config/prisma.js";

const BCRYPT_ROUNDS = 12;

interface CreateUserBody {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  organization_id: string;
}

interface UpdateUserBody {
  first_name?: string;
  last_name?: string;
  role?: string;
  is_active?: boolean;
}

const roleMap: Record<string, string> = {
  support_agent: "SUPPORT_AGENT",
  org_admin: "ORG_ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
};

export async function listUsersForOrg(
  organizationId: string,
  opts: {
    page: number;
    limit: number;
    skip: number;
    role?: string;
    is_active?: boolean;
  },
) {
  const where = {
    organizationId: organizationId,
    ...(opts.role ? { role: opts.role as any } : {}),
    ...(opts.is_active !== undefined ? { isActive: opts.is_active } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: opts.skip,
      take: opts.limit,
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // cast to any to avoid TypeScript complaining about generated count select types
        _count: { select: { assignedTickets: true } } as any,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
      // _count may not exist on the inferred type; use optional chaining and fallback
      assignedTicketsCount: (u as any)?._count?.assignedTickets ?? 0,
    })),
    total,
  };
}

export async function getUserById(userId: string, organizationId?: string) {
  const user = (await prisma.user.findFirst({
    where: {
      id: userId,
      ...(organizationId ? { organizationId: organizationId } : {}),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      organizationId: true,
      createdAt: true,
      updatedAt: true,
      assignedTickets: {
        select: {
          id: true,
          status: true,
          priority: true,
          createdAt: true,
        },
        where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      // cast to any to avoid TypeScript complaining about generated count select types
      _count: { select: { assignedTickets: true } } as any,
    },
  })) as any;

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    organizationId: user.organizationId,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    assignedTicketsCount: user._count?.assignedTickets ?? 0,
    openTickets: user.assignedTickets,
  };
}

export async function createUser(body: CreateUserBody) {
  // Check org exists
  const org = await prisma.organization.findUnique({
    where: { id: body.organization_id },
  });
  if (!org) return { error: "ORGANIZATION_NOT_FOUND" };

  // Check email uniqueness
  const existing = await prisma.user.findUnique({
    where: { email: body.email },
  });
  if (existing) return { error: "EMAIL_ALREADY_EXISTS" };

  const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: body.email,
      passwordHash,
      firstName: body.first_name,
      lastName: body.last_name,
      role: roleMap[body.role] as any,
      organizationId: body.organization_id,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      organizationId: true,
      createdAt: true,
    },
  });

  return { data: { ...user, created_at: user.createdAt.toISOString() } };
}

export async function updateUser(
  userId: string,
  body: UpdateUserBody,
  organizationId?: string,
) {
  const existing = await prisma.user.findFirst({
    where: {
      id: userId,
      ...(organizationId ? { organizationId: organizationId } : {}),
      role: { not: "SUPER_ADMIN" }, // super admins cannot be modified through this endpoint
    },
  });

  if (!existing) return { error: "USER_NOT_FOUND" };

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(body.first_name !== undefined ? { firstName: body.first_name } : {}),
      ...(body.last_name !== undefined ? { lastName: body.last_name } : {}),
      ...(body.role !== undefined ? { role: roleMap[body.role] as any } : {}),
      ...(body.is_active !== undefined ? { isActive: body.is_active } : {}),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      organizationId: true,
      updatedAt: true,
    },
  });

  return { data: { ...user, updated_at: user.updatedAt.toISOString() } };
}

export async function deleteUser(userId: string, organizationId?: string) {
  const existing = await prisma.user.findFirst({
    where: {
      id: userId,
      ...(organizationId ? { organizationId: organizationId } : {}),
      role: { not: "SUPER_ADMIN" },
    },
  });

  if (!existing) return { error: "USER_NOT_FOUND" };

  // // Soft-delete: set is_active = false and unassign their tickets
  // await prisma.$transaction([
  //   prisma.user.update({
  //     where: { id: userId },
  //     data: { isActive: false }, // only user fields here
  //   }),
  //   prisma.ticket.updateMany({
  //     where: {
  //       assignedToId: userId, // check your schema for exact field name
  //       status: { in: ["OPEN", "IN_PROGRESS"] },
  //     },
  //     data: { assignedToId: null }, // only ticket fields here
  //   }),
  // ]);

  //delete user
  await prisma.ticket.updateMany({
    where: {
      assignedToId: userId,
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
    data: { assignedToId: null },
  });

  // Then hard delete the user
  await prisma.user.delete({
    where: { id: userId },
  });

  return { data: { success: true } };
}

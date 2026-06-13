import prisma from "src/config/prisma.js";
import { hashPassword } from "src/utils/password.util.js";
import { Role } from "generated/prisma/enums.js";

async function createSuperAdmin() {
  const email = "superadmin@supportnest.com";
  const password = "SuperAdminPassword123!";
  const firstName = "Super";
  const lastName = "Admin";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // console.log("Super admin already exists.");
    return;
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  // console.log("✅ Super Admin created successfully!");
  // console.log("Email:   ", email);
  // console.log("Password:", password);
}

createSuperAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

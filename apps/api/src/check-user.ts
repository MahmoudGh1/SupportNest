import prisma from "./config/prisma.js";

async function checkUser() {
  const email = "superadmin@supportnest.com";
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    // console.log("User found:", JSON.stringify(user, null, 2));
  } else {
    // console.log("User NOT found");
  }
}

checkUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

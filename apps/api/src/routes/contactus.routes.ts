import { Router } from "express";
import prisma from "../config/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";
import { authMiddleware } from "src/middlewares/auth.middleware.js";

const router: Router = Router();

router.post("/", asyncHandler(async (req, res) => {
  const { name, email, company, message } = req.body;
  if (!name || !email || !message) {
    res.status(400).json({ error: "name, email, and message are required" });
    return;
  }
  const submission = await prisma.contactSubmission.create({
    data: { name, email, company, message },
  });
  res.status(201).json({ success: true, id: submission.id });
}));
/* router.post("/help", authMiddleware, asyncHandler(async (req, res) => {
  const { subject, message } = req.body;
  if (!subject || !message) {
    res.status(400).json({ error: "subject and message are required" });
    return;
  }
  const user = (req as any).user;
  await prisma.contactSubmission.create({
    data: {
      name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
      email: user.email ?? "",
      company: user.organizationId ?? "",
      message: `[HELP REQUEST] ${subject}\n\n${message}`,
    },
  });
  res.status(201).json({ success: true });
})); */
router.post("/help", authMiddleware, asyncHandler(async (req, res) => {
  const { subject, message } = req.body;
  if (!subject || !message) {
    res.status(400).json({ error: "subject and message are required" });
    return;
  }
  const user = (req as any).user;
  console.log("JWT user:", user); // ← add this temporarily
  
  // Fetch from DB using the user id from JWT
  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { firstName: true, lastName: true, email: true, organizationId: true },
  });
const org = dbUser?.organizationId ? await prisma.organization.findUnique({
  where: { id: dbUser.organizationId },
  select: { name: true },
}) : null;
  await prisma.contactSubmission.create({
    data: {
      name: dbUser ? `${dbUser.firstName} ${dbUser.lastName}`.trim() : "Dashboard User",
      email: dbUser?.email ?? "",
      company:  org?.name ?? "",
      message: `[HELP REQUEST] ${subject}\n\n${message}`,
    },
  });
  res.status(201).json({ success: true });
}));

export default router;
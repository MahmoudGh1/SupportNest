import { Router } from "express";
import prisma from "../config/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";

const router: Router = Router();

router.post("/", asyncHandler(async (req, res) => {
  const { name, email, company, message } = req.body;
  if (!name || !email || !message) {
    res.status(400).json({ error: "name, email, and message are required" });
    return;
  }
  const submission = await prisma.contact_submissions.create({
    data: { name, email, company, message },
  });
  res.status(201).json({ success: true, id: submission.id });
}));

export default router;
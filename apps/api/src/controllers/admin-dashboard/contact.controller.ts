import prisma from "../../config/prisma.js";
import asyncHandler from "../../utils/asyncHandler.js";
import type { RequestHandler } from "express";

export const getContactSubmissions: RequestHandler = asyncHandler(async (req, res) => {
  const submissions = await prisma.contact_submissions.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(submissions);
});
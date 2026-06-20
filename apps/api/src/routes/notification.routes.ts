import type { Response, Router } from "express";
import express from "express";
import prisma from "src/config/prisma.js";
import { authMiddleware } from "src/middlewares/auth.middleware.js";
import type { AuthenticatedRequest } from "src/types/auth.types.js";

const router: Router = express.Router();
router.use(authMiddleware);

// ✅ SPECIFIC routes first
// GET /notifications/unread-count
router.get(
  "/unread-count",
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const count = await prisma.notificationRecipient.count({
      where: { userId, readAt: null },
    });
    res.json({ count });
  },
);

// PATCH /notifications/read-all
router.patch("/read-all", async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  await prisma.notificationRecipient.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  res.json({ success: true });
});

// GET /notifications?status=unread&page=1&limit=20
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const { status = "all", page = 1, limit = 20 } = req.query;
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const where = {
    userId,
    ...(status === "unread" ? { readAt: null } : {}),
  };

  const [recipients, total] = await Promise.all([
    prisma.notificationRecipient.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        readAt: true,
        notification: {
          select: { id: true, title: true, body: true, type: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.notificationRecipient.count({ where }),
  ]);

  res.json({ data: recipients, total, page: Number(page) });
});

// ✅ DYNAMIC routes last
// PATCH /notifications/:id/read
router.patch("/:id/read", async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) return res.status(400).json({ error: "Invalid id" });

  await prisma.notificationRecipient.updateMany({
    where: { id, userId },
    data: { readAt: new Date() },
  });
  res.json({ success: true });
});

export default router;

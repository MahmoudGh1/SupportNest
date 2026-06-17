import express from "express";
import prisma from "src/config/prisma.js";
import { authMiddleware } from "src/middlewares/auth.middleware.js";
const router = express.Router();

router.use(authMiddleware);

// GET /notifications?status=unread&page=1&limit=20
router.get("/", async (req, res) => {
  const { status = "all", page = 1, limit = 20 } = req.query;
  const where = {
    user_id: req.user!.id,
    ...(status === "unread" ? { read_at: null } : {}),
  };
  const recipients = await prisma.notificationRecipient.findMany({
    where,
    include: { notification: true },
    orderBy: { created_at: "desc" },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
  });
  res.json({ data: recipients });
});

// GET /notifications/unread-count
router.get("/unread-count", async (req, res) => {
  const count = await prisma.notificationRecipient.count({
    where: { user_id: req.user.id, read_at: null },
  });
  res.json({ count });
});

// PATCH /notifications/:id/read
router.patch("/:id/read", async (req, res) => {
  await prisma.notificationRecipient.updateMany({
    where: { id: req.params.id, user_id: req.user.id },
    data: { read_at: new Date() },
  });
  res.json({ success: true });
});

// PATCH /notifications/read-all
router.patch("/read-all", async (req, res) => {
  await prisma.notificationRecipient.updateMany({
    where: { user_id: req.user.id, read_at: null },
    data: { read_at: new Date() },
  });
  res.json({ success: true });
});

module.exports = router;

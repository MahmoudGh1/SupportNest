import express, { type Router } from "express";
import { authMiddleware } from "src/middlewares/auth.middleware.js";
import { sendInvitationController, validateInvitationController, acceptInvitationController, getTeamController, revokeInvitationController } from "src/controllers/invitation.controller.js";

const invitationRouter: Router = express.Router();

invitationRouter.post("/invite", authMiddleware, sendInvitationController);
invitationRouter.get("/team", authMiddleware, getTeamController);
invitationRouter.delete("/invitations/:id", authMiddleware, revokeInvitationController);

invitationRouter.get("/accept/:token", validateInvitationController);
invitationRouter.post("/accept/:token", acceptInvitationController);
invitationRouter.post("/accept/:token/google", acceptInvitationWithGoogleController);

export default invitationRouter;

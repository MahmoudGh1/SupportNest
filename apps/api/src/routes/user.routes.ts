import express, { Router } from "express";
import { authMiddleware } from "src/middlewares/auth.middleware.js";
import {
  getMeController,
  updateProfileController,
  updatePasswordController,
} from "src/controllers/user.controller.js";

const userRouter: Router = express.Router();

// All user routes require authentication
userRouter.use(authMiddleware);

// GET    /api/v1/users/me            → get current user profile
userRouter.get("/me", getMeController);

// PATCH  /api/v1/users/me            → update name + email
// Body:  { firstName, lastName, email }
userRouter.patch("/me", updateProfileController);

// PATCH  /api/v1/users/me/password   → change password
// Body:  { current_password, new_password }
userRouter.patch("/me/password", updatePasswordController);

export default userRouter;
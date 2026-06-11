import express, { Router } from "express";
import {
	RegisterController,
	LoginController,
	LogoutController,
	RefreshController,
	userController,
} from "src/controllers/auth.controller.js";
import { authMiddleware } from "src/middlewares/auth.middleware.js";

const authRouter: Router = express.Router();

authRouter.post("/register", RegisterController);

authRouter.post("/login", LoginController);

authRouter.post("/refresh", RefreshController);

authRouter.post("/logout", LogoutController);

authRouter.get("/me", authMiddleware, userController);

export default authRouter;

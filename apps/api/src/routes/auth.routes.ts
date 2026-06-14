import express, { Router } from "express";
import { RegisterController, RegisterPaidController, LoginController, LogoutController, RefreshController, userController, GoogleLoginController } from "src/controllers/auth.controller.js";
import { authMiddleware } from "src/middlewares/auth.middleware.js";

const authRouter: Router = express.Router();

authRouter.post("/register", RegisterController);
authRouter.post("/register-paid", RegisterPaidController);

authRouter.post("/login", LoginController);

authRouter.post("/refresh", RefreshController);

authRouter.post("/logout", LogoutController);

authRouter.get("/me", authMiddleware, userController);

authRouter.post("/google", GoogleLoginController);

export default authRouter;

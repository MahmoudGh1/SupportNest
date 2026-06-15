import express, { Router } from "express";
import { RegisterController, RegisterPaidController, LoginController, LogoutController, RefreshController, userController, GoogleLoginController, SendVerificationController, VerifyEmailController, CompleteRegistrationController, ForgotPasswordController, ResetPasswordController, GoogleRegisterController } from "src/controllers/auth.controller.js";
import { authMiddleware } from "src/middlewares/auth.middleware.js";

const authRouter: Router = express.Router();

authRouter.post("/register", RegisterController);
authRouter.post("/register-paid", RegisterPaidController);

authRouter.post("/login", LoginController);

authRouter.post("/refresh", RefreshController);

authRouter.post("/logout", LogoutController);

authRouter.get("/me", authMiddleware, userController);

authRouter.post("/google", GoogleLoginController);

authRouter.post("/send-verification", SendVerificationController);

authRouter.post("/verify-email", VerifyEmailController);

authRouter.post("/complete-registration", CompleteRegistrationController);

authRouter.post("/forgot-password", ForgotPasswordController);

authRouter.post("/reset-password", ResetPasswordController);

authRouter.post("/google-register", GoogleRegisterController);

export default authRouter;

import express, { Router } from "express";
import { RegisterController, LoginController, LogoutController, userController } from "src/controllers/auth.controller.js";

const authRouter: Router = express.Router();

authRouter.post("/register", RegisterController);

authRouter.post("/login", LoginController);

authRouter.post("/logout", LogoutController)

authRouter.get("/me", userController)

export default authRouter;
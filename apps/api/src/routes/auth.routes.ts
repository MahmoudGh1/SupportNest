import express, { Router } from "express";
import { RegisterController, LoginController } from "src/controllers/auth.controller.js";

const authRouter: Router = express.Router();

authRouter.post("/register", RegisterController);

authRouter.post("/login", LoginController);

export default authRouter;
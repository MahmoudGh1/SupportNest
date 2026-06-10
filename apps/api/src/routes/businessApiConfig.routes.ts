import express, { type Router } from "express";
import { authMiddleware } from "src/middlewares/auth.middleware.js";
import { saveApiConfigController, getApiConfigController, verifyApiConfigController } from "src/controllers/businessApiConfig.controller.js";

const businessApiConfigRouter: Router = express.Router();

businessApiConfigRouter.post("/", authMiddleware, saveApiConfigController);
businessApiConfigRouter.get("/", authMiddleware, getApiConfigController);
businessApiConfigRouter.post("/verify", authMiddleware, verifyApiConfigController);

export default businessApiConfigRouter;

import express, { type Router } from "express";
import { authMiddleware } from "src/middlewares/auth.middleware.js";
import { getReportsController, getReportByIdController } from "src/controllers/reporter.controller.js";

const reportRouter: Router = express.Router();

reportRouter.get("/", authMiddleware, getReportsController);
reportRouter.get("/:id", authMiddleware, getReportByIdController);

export default reportRouter;

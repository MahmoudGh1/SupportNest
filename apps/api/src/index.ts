import "dotenv/config";
import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import errorHandler from "./middlewares/errorhandler.middleware.js";
import notFoundHandler from "./middlewares/notFoundHandler.middleware.js";
import { rateLimit } from "./utils/rateLimiter.util.js";
import {
  RegisterController,
  LoginController,
} from "./controllers/auth.controller.js";
import knowledgeRoutes from "./routes/knowledge.routes.js";
import * as authController from "./controllers/auth.controller.js";
import "./workers/knowledgeWorker.js";
import conversationsRoutes from "./routes/conversations.routes.js";
import ApiKeyRouter from "./routes/apiKey.routes.js";
import WidgetRouter from "./routes/widget.routes.js";
import OrganizationRoutes from "./routes/organization.routes.js";
import authRouter from "./routes/auth.routes.js";
import ragRouter from "./routes/rag.routes.js";
import cookieParser from "cookie-parser";
import prisma from "./config/prisma.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(helmet());
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

app.use(express.static("public"));
app.use(morgan("dev"));

app.use(rateLimit);

// Serve widget.js from the public folder
// This makes widget.js available at:
// https://api.supportnest.io/widget.js

app.get("/widget.js", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/javascript");
  next();
});
app.use(express.static(path.join(__dirname, "../public")));

app.get("/health", (_, res) => res.json({ ok: true }));

app.use("/api/v1", knowledgeRoutes);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/rag", ragRouter);
app.use("/api/v1/dashboard/apikey", ApiKeyRouter);
app.use("/api/v1/widget", WidgetRouter);
app.use("/api/v1/organizations", OrganizationRoutes);

app.use("/api/v1/widget/conversations", conversationsRoutes);
app.use(notFoundHandler);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log("Server is running on port:", PORT);
});

// async function main() {
// 	const val = await prisma.organization.findMany();
//   console.log(val)
// }
// main()
// 	.then(async () => {
// 		await prisma.$disconnect();
// 	})
// 	.catch(async (e) => {
// 		console.error(e);
// 		await prisma.$disconnect();
// 		process.exit(1);
// 	});

import "dotenv/config";
import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import errorHandler from "./middlewares/errorhandler.middleware.js";
import notFoundHandler from "./middlewares/notFoundHandler.middleware.js";
import { rateLimit } from "./utils/rateLimiter.util.js";
import knowledgeRoutes from "./routes/knowledge.routes.js";
import "./workers/knowledgeWorker.js";
import conversationsRoutes from "./routes/conversations.routes.js";
import ApiKeyRouter from "./routes/apiKey.routes.js";
import WidgetRouter from "./routes/widget.routes.js";
import OrganizationRoutes from "./routes/organization.routes.js";
import authRouter from "./routes/auth.routes.js";
import ragRouter from "./routes/rag.routes.js";
import cookieParser from "cookie-parser";
import paymentRoutes from "./routes/payment.routes.js";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { setupWebSocket } from "./ws/websocket.js";
import prisma from "./config/prisma.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(
	helmet({
		crossOriginResourcePolicy: false,
		contentSecurityPolicy: false,
	}),
);

app.use(
	cors({
		// Dynamically sets the header to match whoever is making the request
		origin: function (origin, callback) {
			// Allow requests with no origin (like mobile apps, curl, or postman)
			if (!origin) return callback(null, true);

			callback(null, true);
		},
		credentials: true,
	}),
);
app.use(morgan("dev"));

const publicDir = path.resolve(process.cwd(), "public");
// console.log("[static] serving from:", publicDir);
app.use(express.static(publicDir));

app.use(rateLimit);
app.get("/health", (_, res) => res.json({ ok: true }));

app.use("/api/v1", knowledgeRoutes);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/rag", ragRouter);
app.use("/api/v1/dashboard/apikey", ApiKeyRouter);
app.use("/api/v1/widget", WidgetRouter);
app.use("/api/v1/organizations", OrganizationRoutes);
app.use("/api/v1/widget/conversations", conversationsRoutes);
app.use("/api/v1/payments", paymentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const Server = createServer(app);
const wss = new WebSocketServer({ server: Server, path: "/widget/ws" });
setupWebSocket(wss);

Server.listen(PORT, () => {
	console.log("Server is running on port:", PORT);
});

// async function main() {
// 	const val = await prisma.organization.findMany();
// 	console.log(val);
// }
// main();

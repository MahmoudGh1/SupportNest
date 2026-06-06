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
import "./workers/knowledgeWorker.js";
import ApiKeyRouter from "./routes/apiKey.routes.js";
import WidgetRouter from "./routes/widget.routes.js";
import OrganizationRoutes from "./routes/organization.routes.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:3000",
  }),
);
app.use(morgan("dev"));

app.use(rateLimit);

// Serve widget.js from the public folder
app.use(express.static(path.join(__dirname, "../public")));
// This makes widget.js available at:
// https://api.supportnest.io/widget.js

app.use("/widget.js", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/javascript");
  next();
});

app.get("/health", (_, res) => res.json({ ok: true }));

app.post("/api/v1/register", RegisterController);
app.post("/api/v1/login", LoginController);
app.use("/api/v1", knowledgeRoutes);
app.use("/api/v1/dashboard/apikey", ApiKeyRouter);
app.use("/api/v1/widget", WidgetRouter);
app.use("/organizations", OrganizationRoutes);

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

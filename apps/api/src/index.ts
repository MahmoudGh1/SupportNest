import "dotenv/config";
import express from "express";
import prisma from "./config/prisma.js";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import errorHandler from "./middlewares/errorhandler.middleware.js";
import notFoundHandler from "./middlewares/notFoundHandler.middleware.js";
import { rateLimit } from "./utils/rateLimiter.util.js";
import knowledgeRoutes from "./routes/knowledge.routes.js";
import "./workers/knowledgeWorker.js";
import ApiKeyRouter from "./routes/apiKey.routes.js";
import authRouter from "./routes/auth.routes.js";
import ragRouter from "./routes/rag.routes.js";


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

app.get("/health", (_, res) => res.json({ ok: true }));

app.use("/api/v1", knowledgeRoutes);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/rag", ragRouter);
app.use("/api/v1/dashboard/apikey", ApiKeyRouter);

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

import "dotenv/config";
import { capitalize } from "@supportnest/shared";
import express from "express";
import prisma from "./config/prisma.js";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import morgan from "morgan";
import errorHandler from "./middlewares/errorhandler.middleware.js";
import notFoundHandler from "./middlewares/notFoundHandler.middleware.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(helmet());
app.use(
	cors({
		origin: "https://localhost:3000",
	}),
);
app.use(morgan("dev"));

app.get("/health", (_, res) => res.json({ ok: true }));

app.use(notFoundHandler);

app.use(errorHandler);

app.listen(PORT, () => {
	console.log("Server is running on port:", PORT);
});

async function main() {
	const val = await prisma.organization.findMany();
	console.log(val);
}
main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});

import "dotenv/config";
import { capitalize } from "@supportnest/shared";
import express from "express";
import prisma from "./lib/prisma.js";

const app = express();
app.use(express.json());
app.get("/health", (_, res) => res.json({ ok: true }));
app.listen(3001, () => console.log("API running on 3001"));

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

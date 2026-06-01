import { capitalize } from "@supportnest/shared";
import express from "express";
import cors from "cors"
import helmet from "helmet"
import dotenv from "dotenv"
import errorHandler from "./middlewares/errorhandler.middleware"
import notFoundHandler from "./middlewares/notFoundHandler.middleware"

dotenv.config()

const app = express();
app.use(express.urlencoded({extended: true}))
app.use(express.json());

app.get("/health", (_, res) => res.json({ ok: true }));

app.use(notFoundHandler)

app.use(errorHandler)
app.listen(3001, () => console.log("API running on 3001"));

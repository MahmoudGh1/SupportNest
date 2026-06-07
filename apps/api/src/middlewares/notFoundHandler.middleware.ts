import type { Request, Response, NextFunction } from "express";
import AppError from "../utils/appError.js";

const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
	const statusCode = 404;
	next(new AppError("Page not found", statusCode));
};

export default notFoundHandler;

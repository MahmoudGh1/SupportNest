import type {Request, Response, NextFunction, RequestHandler} from "express"
import AppError from "../utils/appError.js"

const notFoundHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
    const statusCode = 404
    next(new AppError("Page not found", statusCode))
}

export default notFoundHandler;
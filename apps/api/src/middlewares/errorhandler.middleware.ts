import type {Request, Response, NextFunction, RequestHandler} from "express"
import AppError from "../utils/appError.js"

const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500
    return res.status(statusCode).json({
        message: err.message || "Server Error"
    })
}

export default errorHandler
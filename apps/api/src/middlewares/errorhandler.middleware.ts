import type {Request, Response, NextFunction, RequestHandler} from "express"
import AppError from "../utils/AppError"

const errorHandler = (req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500
    return res.status(statusCode).json({
        message: err.message || "Server Error"
    })
}

export default errorHandler
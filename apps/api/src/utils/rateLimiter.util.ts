import * as rateLimiter from "express-rate-limit"
import type {Request, Response, NextFunction} from "express"


export const rateLimit = rateLimiter.rateLimit({
    handler: (req: Request, res: Response, next: NextFunction, options: rateLimiter.Options) => {
        res.status(options.statusCode).json(options.message)
    },
    windowMs: 15 * 60 * 1000,
    limit: 100,
    legacyHeaders: false,
    standardHeaders: 'draft-7',
    ipv6Subnet: 52
})
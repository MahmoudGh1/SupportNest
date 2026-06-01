class AppError extends Error {
    public statusCode
    constructor(message: string, statusCode = 500){
        super(message)
        this.statusCode = statusCode
        Error.captureStackTrace(this, this.constructor)
    }
}

class notFoundError extends AppError {
    constructor(message: string){
        super(message, 404)
    }
}

export default AppError;
class AppError extends Error {
    constructor(message, statusCode = 500){
        super(message)
        this.statusCode = statusCode
        Error.captureStackTrace(this, this.constructor)
    }
}

class notFoundError extends AppError {
    constructor(message){
        super(message, 404)
    }
}

export default AppError;
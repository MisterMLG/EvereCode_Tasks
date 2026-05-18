class SchedulerError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

class InvalidTaskNameError extends SchedulerError {
    constructor() {
        super('Task name must be a non-empty string');
    }
}

class InvalidTaskIntervalError extends SchedulerError {
    constructor() {
        super('Interval must be a positive integer');
    }
}

class InvalidTaskHandlerError extends SchedulerError {
    constructor() {
        super('Task must be a function');
    }
}

class InvalidLoggerError extends SchedulerError {
    constructor() {
        super('Logger must be a function');
    }
}

module.exports = {
    SchedulerError,
    InvalidTaskNameError,
    InvalidTaskIntervalError,
    InvalidTaskHandlerError,
    InvalidLoggerError
};
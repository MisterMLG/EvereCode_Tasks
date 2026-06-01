class SchedulerError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

class SchedulerValidationError extends SchedulerError {
    constructor(message) {
        super(message);
    }
}

module.exports = {
    SchedulerError,
    SchedulerValidationError
};
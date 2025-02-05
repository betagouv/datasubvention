import StaticError from "./StaticError";

export default class NotFoundError extends StaticError {
    static httpCode = 404;

    constructor(data, error) {
        super(data, error);
        this.httpCode = NotFoundError.httpCode;
    }
}

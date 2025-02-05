import StaticError from "./StaticError";

export default class UnauthorizedError extends StaticError {
    static httpCode = 401;

    constructor(data, error) {
        super(data, error);
        this.httpCode = UnauthorizedError.httpCode;
    }
}

import StaticError from "./StaticError";

export default class BadRequestError extends StaticError {
    static httpCode = 400;

    constructor(data, error) {
        super(data, error);
        this.httpCode = BadRequestError.httpCode;
    }
}

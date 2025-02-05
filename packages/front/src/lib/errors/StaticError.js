export default class StaticError extends Error {
    constructor(data, error) {
        super(data.message);
        this.data = data;
        this.__nativeError__ = error;
        this.httpCode = StaticError.httpCode;
    }

    static httpCode = 0;
}

import { Method } from "axios";

export default class ProviderRequestLog {
    constructor(
        public providerId: string,
        public route: string,
        public date: Date,
        public responseCode: number,
        public type: Method,
        public id?: string,
    ) {}
}

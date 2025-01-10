import { ObjectId } from "mongodb";
import { Method } from "axios";

export default interface ProviderRequestLogDbo {
    _id: ObjectId;
    providerId: string;
    route: string;
    date: Date;
    responseCode: number;
    type: Method;
}

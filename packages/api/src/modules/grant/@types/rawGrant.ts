type DefaultObject = Record<string, any>;

// TODO: rename RawGrant to RawData ?
export type RawGrant<T = DefaultObject> = {
    provider: string;
    // TODO: rename fullGrant to grant if we rename RawGrant to RawData ?
    type: "application" | "fullGrant" | "payment";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- neither never nor unknown works
    data: T;
    joinKey?: string;
};

export interface RawApplication<T = DefaultObject> extends RawGrant<T> {
    type: "application";
}

export interface RawPayment<T = DefaultObject> extends RawGrant<T> {
    type: "payment";
}

export interface RawFullGrant<Type1 = DefaultObject, T2 = DefaultObject> extends RawGrant {
    type: "fullGrant";
}

export type AnyRawGrant = RawFullGrant | RawApplication | RawPayment;

export type JoinedRawGrant = {
    fullGrants?: RawFullGrant[];
    payments?: RawPayment[];
    applications?: RawApplication[];
};

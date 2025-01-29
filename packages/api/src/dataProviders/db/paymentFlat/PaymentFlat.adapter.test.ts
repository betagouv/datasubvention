import { ObjectId } from "mongodb";
import { PAYMENT_FLAT_DBO, PAYMENT_FLAT_DBO_WITH_NULLS } from "./__fixtures__/paymentFlatDbo.fixture";

import { PAYMENT_FLAT_ENTITY, PAYMENT_FLAT_ENTITY_WITH_NULLS } from "./__fixtures__/paymentFlatEntity.fixture";
import PaymentsFlatAdapter from "./PaymentFlat.adapter";

describe("PaymentFlatAdapter", () => {
    describe("toDbo", () => {
        it("given entity without nulls, should return a PaymentFlatDbo without nulls", () => {
            const result = PaymentsFlatAdapter.toDbo(PAYMENT_FLAT_ENTITY);
            expect(result).toEqual({ ...PAYMENT_FLAT_DBO, _id: expect.any(ObjectId) });
        });
        it("given entity with nulls, should return a PaymentFlatDbo with nulls", () => {
            const result = PaymentsFlatAdapter.toDbo(PAYMENT_FLAT_ENTITY_WITH_NULLS);
            expect(result).toEqual({ ...PAYMENT_FLAT_DBO_WITH_NULLS, _id: expect.any(ObjectId) });
        });
    });

    describe("dboToEntity", () => {
        it("given dbo without nulls, should return a PaymentFlatEntity without nulls", () => {
            const result = PaymentsFlatAdapter.dboToEntity(PAYMENT_FLAT_DBO);
            expect(result).toEqual(PAYMENT_FLAT_ENTITY);
        });
        it("given dbo with nulls, should return a PaymentFlatEntity with nulls", () => {
            const result = PaymentsFlatAdapter.dboToEntity(PAYMENT_FLAT_DBO_WITH_NULLS);
            expect(result).toEqual(PAYMENT_FLAT_ENTITY_WITH_NULLS);
        });
    });

});

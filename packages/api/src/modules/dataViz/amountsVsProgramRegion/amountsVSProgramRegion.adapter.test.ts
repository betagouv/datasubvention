import {
    PAYMENT_FLAT_ENTITY,
    PAYMENT_FLAT_ENTITY_WITH_NULLS,
} from "../../../dataProviders/db/paymentFlat/__fixtures__/paymentFlatEntity.fixture";
import AmountsVsProgrammeRegionAdapter from "./amountsVsProgramRegion.adapter";

const EXPECTED_WITHOUT_NULLS = {
    exerciceBudgetaire: 2023,
    programme: "1 - Programme Exemple",
    mission: "Mission Exemple",
    montant: 1000,
    regionAttachementComptable: "Bretagne",
};

const EXPECTED_WITH_NULLS = {
    exerciceBudgetaire: 2023,
    programme: "1",
    mission: "Mission Exemple",
    montant: 1000,
    regionAttachementComptable: "Bretagne",
};

describe("AmountsVsProgrammeRegionAdapter", () => {
    describe("toNotAggregatedEntity", () => {
        it("should return right mapping when paymentFlat is without nulls", () => {
            const actual = AmountsVsProgrammeRegionAdapter.toNotAggregatedEntity(PAYMENT_FLAT_ENTITY);
            const expected = EXPECTED_WITHOUT_NULLS;
            expect(actual).toEqual(expected);
        });

        it("should return right mapping when paymentFlat is with nulls", () => {
            const actual = AmountsVsProgrammeRegionAdapter.toNotAggregatedEntity(PAYMENT_FLAT_ENTITY_WITH_NULLS);
            const expected = EXPECTED_WITH_NULLS;
            expect(actual).toEqual(expected);
        });
    });
});

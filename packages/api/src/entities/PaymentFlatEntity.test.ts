import PaymentFlatEntity from "./PaymentFlatEntity";
import * as Sentry from "@sentry/node";

jest.mock("@sentry/node");

const testCases = [
    ["ADCE", "Administration Centrale"],
    ["DOM1", "DOM-TOM"],
    ["ALSA", "Grand Est"],
    ["AQUI", "Nouvelle-Aquitaine"],
    ["AUVE", "Auvergne-Rhône-Alpes"],
];

describe("PaymentFlatEntity", () => {
    describe("getRegionAttachementComptable", () => {
        it.each(testCases)("should return the region for a given valid region code", (regionCode, expected) => {
            const actual = PaymentFlatEntity.getRegionAttachementComptable(regionCode);

            expect(actual).toEqual(expected);
        });

        it("should return region name not found for an invalid region code", () => {
            const actual = PaymentFlatEntity.getRegionAttachementComptable("INVALID");
            const expected = "code region inconnu";
            expect(actual).toBe(expected);
        });

        it("should call Sentry.captureException for an invalid region code", () => {
            PaymentFlatEntity.getRegionAttachementComptable("INVALID");

            expect(Sentry.captureException).toHaveBeenCalled();
        });

        it("should return N/A for a N/A region code", () => {
            const actual = PaymentFlatEntity.getRegionAttachementComptable("N/A");
            const expected = "N/A";
            expect(actual).toBe(expected);
        });
    });
});

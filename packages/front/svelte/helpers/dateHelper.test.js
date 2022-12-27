import * as DateHelper from "./dateHelper";

describe("DateHelper", () => {
    describe("dateToDDMMYYYY()", () => {
        it("should return DD/MM/YYYY date", () => {
            const expected = "01/01/2023";
            const actual = DateHelper.dateToDDMMYYYY(new Date("01-01-2023"));
            expect(actual).toEqual(expected);
        })
    })


    describe("computeSameDateInPreviousYear", () => {
        it("should return start date", async () => {
            const expected = new Date(2021, 10, 12);

            const endDate = new Date(2022, 10, 12);

            const actual = DateHelper.computeSameDateInPreviousYear(endDate);

            expect(actual).toEqual(expected);
        });
    });
});

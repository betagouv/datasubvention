import {
    AMOUNTS_VS_PROGRAM_REGION_DBOS,
    AMOUNTS_VS_PROGRAM_REGION_ENTITIES,
} from "../../../../modules/dataViz/amountsVsProgramRegion/__fixtures__/amountsVSProgramRegion.fixture";
import AmountsVsProgrammeRegionAdapter from "./amountsVsProgramRegion.adapter";
describe("AmountsVsProgrammeRegionAdapter", () => {
    describe("toDbo", () => {
        it("should return right mapping", () => {
            const actual = AmountsVsProgrammeRegionAdapter.toDbo(AMOUNTS_VS_PROGRAM_REGION_ENTITIES[0]);
            const expected = { ...AMOUNTS_VS_PROGRAM_REGION_DBOS[0], _id: expect.any(Object) };
            expect(actual).toEqual(expected);
        });
    });
});

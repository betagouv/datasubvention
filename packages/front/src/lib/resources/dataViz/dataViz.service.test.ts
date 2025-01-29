import type { MontantVsProgrammeRegionDto } from "dto";
import dataVizService from "./dataViz.service";
import dataVizPort from "./dataViz.port";

vi.mock("./dataViz.port", () => ({
    default: {
        getAmountsVsProgramRegion: vi.fn(),
    },
}));

const mockedDataVizPort = vi.mocked(dataVizPort);

describe("DataVizService", () => {
    describe("getAmountsVsProgramRegion", () => {
        it("should call getMontantVsProgrammeRegion", async () => {
            await dataVizService.getAmountsVsProgramRegion();
            expect(mockedDataVizPort.getAmountsVsProgramRegion).toHaveBeenCalled();
        });

        it("should return result from getMontantVsProgrammeRegion", async () => {
            const expected = [""] as unknown as MontantVsProgrammeRegionDto[];
            mockedDataVizPort.getAmountsVsProgramRegion.mockResolvedValueOnce(expected);
            const actual = await dataVizService.getAmountsVsProgramRegion();
            expect(actual).toBe(expected);
        });
    });
});

import amountsVsProgrammeRegionService from "../../modules/dataViz/amountsVsProgramRegion/amountsVsProgramRegion.service";
import { DataVizHttp } from "./DataViz.http";
import { AMOUNTS_VS_PROGRAM_REGION_ENTITIES } from "../../modules/dataViz/amountsVsProgramRegion/__fixtures__/amountsVSProgramRegion.fixture";
import { MontantVsProgrammeRegionDto } from "dto";

const controller = new DataVizHttp();

describe("DataVizHttp", () => {
    const MontantVsProgrammeRegionDtoList = AMOUNTS_VS_PROGRAM_REGION_ENTITIES as MontantVsProgrammeRegionDto[];

    describe("getMontantVsProgrammeRegion", () => {
        let getAmountsVsProgramRegionDataSpy = jest.spyOn(
            amountsVsProgrammeRegionService,
            "getAmountsVsProgramRegionData",
        );
        beforeAll(() => {
            getAmountsVsProgramRegionDataSpy.mockResolvedValue(MontantVsProgrammeRegionDtoList);
        });

        it("should call service", async () => {
            await controller.getMontantVsProgrammeRegion();
            expect(amountsVsProgrammeRegionService.getAmountsVsProgramRegionData).toHaveBeenCalledTimes(1);
        });

        it("should return data", async () => {
            const expected = { montantVersusProgrammeRegionData: MontantVsProgrammeRegionDtoList };
            const actual = await controller.getMontantVsProgrammeRegion();
            expect(actual).toEqual(expected);
        });

        it("should throw error", async () => {
            const ERROR_MESSAGE = "Error";
            getAmountsVsProgramRegionDataSpy.mockImplementationOnce(() => Promise.reject(new Error(ERROR_MESSAGE)));
            expect(() => controller.getMontantVsProgrammeRegion()).rejects.toThrowError(ERROR_MESSAGE);
        });
    });
});

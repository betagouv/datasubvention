import dataVizPort from "./dataViz.port";
import requestsService from "$lib/services/requests.service";

vi.mock("$lib/services/requests.service");
const mockedRequestService = vi.mocked(requestsService);

describe("DataVizPort", () => {
    describe("getResource", () => {
        it("should call requestService", async () => {
            await dataVizPort.getResource("resource");
            expect(mockedRequestService.get).toHaveBeenCalledWith(`/dataviz/resource`);
        });
    });

    describe("GET methods", () => {
        const mockGetResource = vi.spyOn(dataVizPort, "getResource");

        beforeAll(() => {
            // @ts-expect-error: mock empty axios response
            mockGetResource.mockResolvedValue({ data: {} });
        });

        afterAll(() => {
            mockGetResource.mockRestore();
        });

        describe("getAmountsVsProgramRegion", () => {
            it("should call getResource", async () => {
                await dataVizPort.getAmountsVsProgramRegion();
                expect(mockGetResource).toHaveBeenCalledWith("montant-versus-programme-region");
            });

            it("should return data from requestsService result", async () => {
                const expected = "";
                const RES = { data: { montantVersusProgrammeRegionData: expected } };
                // @ts-expect-error: mock
                mockGetResource.mockResolvedValueOnce(RES);
                const actual = await dataVizPort.getAmountsVsProgramRegion();
                expect(actual).toBe(expected);
            });
        });
    });
});

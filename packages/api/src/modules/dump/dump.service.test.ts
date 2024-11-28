import dumpService from "./dump.service";
import metabaseDumpRepo from "../../dataProviders/db/dump/metabase-dump.port";
import userCrudService from "../user/services/crud/user.crud.service";

jest.mock("../user/services/crud/user.crud.service");
jest.mock("../../dataProviders/db/dump/metabase-dump.port");
jest.mock("../configurations/configurations.service");
jest.mock("../stats/stats.service", () => ({
    getAnonymizedLogsOnPeriod: jest.fn((..._args) => ({ hasNext: jest.fn(() => false) })),
    getAssociationsVisitsOnPeriod: jest.fn(() => []),
}));
jest.mock("../../configurations/env.conf", () => ({
    ENV: "prod", // needed because else publishStatsData does nothing
}));

describe("dumpService", () => {
    describe("patchWithPipedriveData", () => {
        it("calls repo", () => {
            // @ts-expect-error -- test private
            dumpService.patchWithPipedriveData();
            expect(metabaseDumpRepo.patchWithPipedriveData).toHaveBeenCalled();
        });
    });

    describe("importPipedriveData", () => {
        it("calls repo with arg", () => {
            dumpService.importPipedriveData([]);
            expect(metabaseDumpRepo.savePipedrive).toHaveBeenCalledWith([]);
        });
    });

    describe("publishStatsData", () => {
        it("patches users with pipedrive", async () => {
            // @ts-expect-error -- test private method
            const patchSpy = jest.spyOn(dumpService, "patchWithPipedriveData");
            const users = ["something"];
            // @ts-expect-error -- mock typing
            jest.mocked(userCrudService.find).mockResolvedValueOnce(users);
            await dumpService.publishStatsData();
            expect(patchSpy).toHaveBeenCalled();
        });
    });
});

import DumpCli from "../../src/interfaces/cli/Dump.cli";
import { USER_WITHOUT_SECRET } from "../../src/modules/user/__fixtures__/user.fixture";
import userRepository from "../../src/modules/user/repositories/user.repository";
import metabaseDumpRepo from "../../src/modules/dump/repositories/metabase-dump.repository";

jest.mock("../../src/configurations/env.conf", () => ({
    ENV: "prod", // needed because else publishStatsData does nothing
}));

describe("dump", () => {
    // TODO separate commit
    const dumpCli = new DumpCli();
    describe("publishStatsData", () => {
        it("saves users merged with pipedrive", async () => {
            const users = [USER_WITHOUT_SECRET, { ...USER_WITHOUT_SECRET, email: "damion.ross@ac-corse.fr" }];
            // @ts-expect-error -- types
            await Promise.all(users.map(user => userRepository.create(user)));
            await dumpCli.publishStatsData();
            const actual = await metabaseDumpRepo.getUsers();
            expect(actual).toMatchSnapshot();
        });
    });

    describe.skip("importPipedriveData", () => {
        it("imports users to specific collection", () => {});
    });
});

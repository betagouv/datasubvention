import adminStructureService from "./adminStructure.service";
import { BadRequestError } from "../../shared/errors/httpErrors";
import adminStructureRepository from "./repositories/adminStructure.repository";
import { AgentTypeEnum } from "@api-subventions-asso/dto";

jest.mock("./repositories/adminStructure.repository");

describe("AdminStructureService", () => {
    const REPO_RES = "PROMISE";
    const AGENT_TYPE = AgentTypeEnum.OPERATOR;

    describe("getAdminStructureByStringAgentType", () => {
        let getTyped: jest.SpyInstance;

        beforeAll(() => {
            getTyped = jest.spyOn(adminStructureService, "getAdminStructureByAgentType");
            getTyped.mockResolvedValue(REPO_RES);
        });
        afterAll(() => {
            getTyped.mockRestore();
        });
        it("throws bad request if arg is not agentType", () => {
            const test = () =>
                adminStructureService.getAdminStructureByStringAgentType("notAnAgentType" as AgentTypeEnum);
            expect(test).rejects.toThrow(BadRequestError);
        });

        it("calls repository", async () => {
            await adminStructureService.getAdminStructureByStringAgentType(AGENT_TYPE);
            expect(getTyped).toHaveBeenCalledWith(AGENT_TYPE);
        });

        it("returns result from repository", async () => {
            const expected = REPO_RES;
            const actual = await adminStructureService.getAdminStructureByStringAgentType(AGENT_TYPE);
            expect(actual).toBe(expected);
        });
    });

    describe("getAdminStructureByAgentType", () => {
        beforeAll(() => {
            // @ts-expect-error mock
            jest.mocked(adminStructureRepository.findAllByAgentType).mockReturnValue(REPO_RES);
        });
        afterAll(() => {
            jest.mocked(adminStructureRepository.findAllByAgentType).mockReset();
        });

        it("calls repository", () => {
            adminStructureService.getAdminStructureByAgentType(AGENT_TYPE);
            expect(adminStructureRepository.findAllByAgentType).toHaveBeenCalledWith(AGENT_TYPE);
        });

        it("returns result from repository", () => {
            const expected = REPO_RES;
            const actual = adminStructureService.getAdminStructureByAgentType(AGENT_TYPE);
            expect(actual).toBe(expected);
        });
    });
});

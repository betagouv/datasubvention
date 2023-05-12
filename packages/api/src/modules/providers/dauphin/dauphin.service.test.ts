import axios from "axios";
import configurationsService from "../../configurations/configurations.service";
import DauphinDtoAdapter from "./adapters/DauphinDtoAdapter";
import dauphinService from "./dauphin.service";
import dauphinGisproRepository from "./repositories/dauphin-gispro.repository";
import SpyInstance = jest.SpyInstance;

jest.mock("axios", () => ({
    post: jest.fn(),
    get: jest.fn(),
}));

jest.mock("./repositories/dauphin-gispro.repository", () => ({
    getLastImportDate: jest.fn(() => new Date()),
    upsert: jest.fn(),
    findBySiret: jest.fn(),
    findBySiren: jest.fn(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

const SIRET = "12345678912345";

jest.mock("./../../../configurations/apis.conf", () => ({
    DAUPHIN_USERNAME: "DAUPHIN_USERNAME",
    DAUPHIN_PASSWORD: "DAUPHIN_PASSWORD",
}));

describe("Dauphin Service", () => {
    const TOKEN = "FAKE_TOKEN";

    const DATA = [{ a: true }, { b: true }];

    beforeEach(() => {
        mockedAxios.post.mockImplementation(async (url, search, headers) => ({
            data: {
                hits: {
                    total: DATA.length,
                    hits: DATA,
                },
            },
        }));
    });

    describe("getDemandeSubventionBySiret", () => {
        const mockToDemandeSubvention = jest.spyOn(DauphinDtoAdapter, "toDemandeSubvention");

        afterEach(() => mockToDemandeSubvention.mockReset());

        it("should return subventions", async () => {
            const APPLICATION_ENTITIES = [{ id: "A" }, { id: "B" }];
            const expected = APPLICATION_ENTITIES;
            // @ts-expect-error: mock return value
            dauphinGisproRepository.findBySiret.mockImplementationOnce(async () => APPLICATION_ENTITIES);
            // @ts-expect-error: mock return value
            mockToDemandeSubvention.mockImplementation(data => data);

            const actual = await dauphinService.getDemandeSubventionBySiret(SIRET);

            expect(actual).toEqual(expected);
        });
    });

    describe("getDemandeSubventionBySiren", () => {
        const mockToDemandeSubvention = jest.spyOn(DauphinDtoAdapter, "toDemandeSubvention");

        it("should return subventions", async () => {
            const expected = [{ fake: "data" }];
            // @ts-expect-error: mock return value
            dauphinGisproRepository.findBySiren.mockImplementationOnce(async () => expected);
            // @ts-expect-error: mock return value
            mockToDemandeSubvention.mockImplementationOnce(data => data);
            const actual = await dauphinService.getDemandeSubventionBySiren("FAKE_SIREN");
            expect(actual).toEqual(expected);
        });
    });

    describe("getDemandeSubventionByRna", () => {
        it("should return null", async () => {
            const expected = null;
            const actual = await dauphinService.getDemandeSubventionByRna();
            expect(expected).toBe(actual);
        });
    });

    describe("updateApplicationCache", () => {
        // @ts-expect-error spy private method
        const mockBuildSearchHeader = jest.spyOn(dauphinService, "buildSearchHeader");
        // @ts-expect-error spy private method
        const mockBuildFetchFromDateQuery = jest.spyOn(dauphinService, "buildFetchApplicationFromDateQuery");
        // @ts-expect-error spy private method
        const mockFormatAndReturnDto = jest.spyOn(dauphinService, "formatAndReturnApplicationDto");
        // @ts-expect-error: spy private method
        const mockSaveApplicationsInCache = jest.spyOn(dauphinService, "saveApplicationsInCache");
        // @ts-expect-error: spy private method
        const mockGetAuthToken = jest.spyOn(dauphinService, "getAuthToken");
        const mocks = [
            mockBuildSearchHeader,
            mockBuildFetchFromDateQuery,
            mockFormatAndReturnDto,
            mockSaveApplicationsInCache,
            mockGetAuthToken,
        ];

        beforeEach(() => {
            // @ts-expect-error: mock
            mockGetAuthToken.mockImplementation(async () => TOKEN);
            //@ts-expect-error: mock
            mockBuildSearchHeader.mockImplementation(() => ({ headers: {} }));
            mockBuildFetchFromDateQuery.mockImplementation(jest.fn());
            //@ts-expect-error: mock
            mockFormatAndReturnDto.mockImplementation(jest.fn(application => application));
        });

        afterEach(() => {
            mocks.map(mock => mock.mockReset());
        });

        afterAll(() => mocks.map(mock => mock.mockRestore()));

        it("should call repository.getLastImportDate()", async () => {
            await dauphinService.updateApplicationCache();
            expect(dauphinGisproRepository.getLastImportDate).toHaveBeenCalledTimes(1);
        });

        it("should call getAuthToken", async () => {
            await dauphinService.updateApplicationCache();
            expect(mockGetAuthToken).toHaveBeenCalledTimes(1);
        });

        it("should call buildFetchFromDateQuery", async () => {
            const DATE = new Date();
            await dauphinService.updateApplicationCache();
            expect(mockBuildFetchFromDateQuery).toHaveBeenCalledWith(DATE);
        });

        it("should build headers from token", async () => {
            const expected = TOKEN;
            await dauphinService.updateApplicationCache();
            expect(mockBuildSearchHeader).toHaveBeenCalledWith(expected);
        });

        it("should call axios with args", async () => {
            const DATE = new Date();
            await dauphinService.updateApplicationCache();
            // @ts-expect-error: mock
            expect(axios.post.mock.calls[0]).toMatchSnapshot();
        });

        it("should call mockSaveApplicationsInCache", async () => {
            await dauphinService.updateApplicationCache();
            expect(mockSaveApplicationsInCache).toHaveBeenCalledTimes(1);
        });
    });

    describe("saveApplicationsInCache", () => {
        it("should upsert entities asynchronously", async () => {
            const ENTITIES = [{ reference: "REF1" }, { reference: "REF2" }];
            // @ts-expect-error: private method
            await dauphinService.saveApplicationsInCache(ENTITIES);
            expect(dauphinGisproRepository.upsert).toHaveBeenNthCalledWith(1, { dauphin: ENTITIES[0] });
            expect(dauphinGisproRepository.upsert).toHaveBeenNthCalledWith(2, { dauphin: ENTITIES[1] });
        });
    });

    describe("formatAndReturnDto", () => {
        it("should remove fields", () => {
            const objectToKeep = { foo: "bar" };
            const demandeurFieldToKeep = { fieldToKeep: "baz" };
            const beneficiaireFieldToKeep = { fieldToKeep: "ban" };
            const expected = {
                objectToKeep,
                demandeur: demandeurFieldToKeep,
                beneficiaires: [beneficiaireFieldToKeep],
            };
            // @ts-expect-error: private method
            const actual = dauphinService.formatAndReturnApplicationDto({
                _source: {
                    objectToKeep,
                    demandeur: { ...demandeurFieldToKeep, pieces: "", history: "", linkedUsers: "" },
                    beneficiaires: [{ ...beneficiaireFieldToKeep, pieces: "", history: "", linkedUsers: "" }],
                },
            });
            expect(actual).toEqual(expected);
        });
    });

    describe("toDauphinDateString", () => {
        it("should return date", () => {
            const DATE = new Date("2023-04-12");
            const expected = "2023-04-12";
            // @ts-expect-error: private method
            const actual = dauphinService.toDauphinDateString(DATE);
            expect(actual).toEqual(expected);
        });
    });

    describe("buildSearchHeader", () => {
        it("should build header", () => {
            // @ts-expect-error buildSearchHeader is private
            expect(dauphinService.buildSearchHeader(TOKEN)).toMatchSnapshot();
        });
    });

    describe("getAuthToken", () => {
        const getDauphinTokenMock: jest.SpyInstance<unknown> = jest.spyOn(configurationsService, "getDauphinToken");
        const getDauphinTokenAvailableTimeMock: jest.SpyInstance<unknown> = jest.spyOn(
            configurationsService,
            "getDauphinTokenAvailableTime",
        );
        const setDauphinTokenMock: jest.SpyInstance<unknown> = jest.spyOn(configurationsService, "setDauphinToken");
        // @ts-expect-error sendAuthRequest is private
        const sendAuthRequestMock: jest.SpyInstance<unknown> = jest.spyOn(dauphinService, "sendAuthRequest");

        it("should return cached token", async () => {
            getDauphinTokenMock.mockImplementationOnce(() => ({
                updatedAt: new Date(),
                data: TOKEN,
            }));
            getDauphinTokenAvailableTimeMock.mockImplementationOnce(() => ({
                data: Infinity,
            }));

            // @ts-expect-error getAuthToken is private
            const actual = await dauphinService.getAuthToken();

            expect(actual).toBe(TOKEN);
        });

        it("should return new token", async () => {
            getDauphinTokenMock.mockImplementationOnce(() => ({
                updatedAt: new Date(),
                data: "WRONG_TOKEN",
            }));
            getDauphinTokenAvailableTimeMock.mockImplementationOnce(() => ({
                data: -Infinity,
            }));
            sendAuthRequestMock.mockImplementationOnce(() => TOKEN);
            setDauphinTokenMock.mockImplementationOnce(() => null);
            // @ts-expect-error getAuthToken is private
            const actual = await dauphinService.getAuthToken();

            expect(actual).toBe(TOKEN);
        });

        it("should return new token because no old token", async () => {
            getDauphinTokenMock.mockImplementationOnce(() => null);
            getDauphinTokenAvailableTimeMock.mockImplementationOnce(() => ({
                data: -Infinity,
            }));
            sendAuthRequestMock.mockImplementationOnce(() => TOKEN);
            setDauphinTokenMock.mockImplementationOnce(() => null);
            // @ts-expect-error getAuthToken is private
            const actual = await dauphinService.getAuthToken();

            expect(actual).toBe(TOKEN);
        });

        it("should save the new token", async () => {
            getDauphinTokenMock.mockImplementationOnce(() => ({
                updatedAt: new Date(),
                data: "WRONG_TOKEN",
            }));
            getDauphinTokenAvailableTimeMock.mockImplementationOnce(() => ({
                data: -Infinity,
            }));
            sendAuthRequestMock.mockImplementationOnce(() => TOKEN);
            setDauphinTokenMock.mockImplementationOnce(() => null);

            // @ts-expect-error getAuthToken is private
            const actual = await dauphinService.getAuthToken();

            expect(setDauphinTokenMock).toHaveBeenCalledWith(TOKEN);
        });
    });

    describe("sendAuthRequest", () => {
        it("should call axios", async () => {
            // @ts-expect-error sendAuthRequest is private
            await dauphinService.sendAuthRequest();
            // @ts-expect-error: mock
            expect(axios.post.mock.calls[0]).toMatchSnapshot();
        });

        it("should return data", async () => {
            const expected = { hello: "world" };
            // @ts-expect-error: mock
            axios.post.mockImplementationOnce(async () => ({ data: expected }));

            // @ts-expect-error sendAuthRequest is private
            const actual = await dauphinService.sendAuthRequest();

            expect(actual).toEqual(expected);
        });
    });

    describe("getSpecificDocumentStream", () => {
        let mockGetAuthToken: SpyInstance;
        const DOC_PATH = "PATH";
        const AXIOS_RES = "RES";

        beforeAll(() => {
            // @ts-expect-error: mock
            mockGetAuthToken = jest.spyOn(dauphinService, "getAuthToken").mockImplementation(async () => TOKEN);
            // @ts-expect-errors mocked
            axios.get.mockResolvedValue({ data: AXIOS_RES });
        });

        it("should call getAuthToken", async () => {
            await dauphinService.getSpecificDocumentStream(DOC_PATH);
            expect(mockGetAuthToken).toHaveBeenCalledTimes(1);
        });

        it("should call axios with args", async () => {
            await dauphinService.getSpecificDocumentStream(DOC_PATH);
            // @ts-expect-error: mock
            expect(axios.get.mock.calls[0]).toMatchSnapshot();
        });

        it("should return stream from axios", async () => {
            const expected = AXIOS_RES;
            const actual = await dauphinService.getSpecificDocumentStream(DOC_PATH);
            expect(actual).toEqual(expected);
        });
    });

    describe("getDocumentsByRna", () => {
        // TODO
    });

    describe("getDocumentsBySiren", () => {
        // TODO
    });

    describe("getDocumentsBySiret", () => {
        // TODO
    });

    describe("getInternalId", () => {
        // TODO
    });
});

import fs from "fs";
import path from "path";
import { main, loadConfig, processFile } from "./ScdlDataIntegration.node";
import {
    SCDL_FILE_PROCESSING_PATH,
    SCDL_FILE_PROCESSING_CONFIG_FILENAME,
} from "../../configurations/scdlIntegration.conf";
import ScdlCli from "../cli/Scdl.cli";
import { ScdlFileProcessingConfigList, ScdlParseArgs, ScdlParseXlsArgs } from "../../@types/ScdlDataIntegration";

jest.mock("../../configurations/scdlIntegration.conf", () => ({
    SCDL_FILE_PROCESSING_PATH: path.resolve(__dirname, "test-integration"),
    SCDL_FILE_PROCESSING_CONFIG_FILENAME: "test-scdl-file-processing.config.json",
}));
jest.mock("../cli/Scdl.cli");
jest.mock("fs");

const validConfigData: ScdlFileProcessingConfigList = {
    files: [
        {
            name: "donnees-a-integrer1.csv",
            parseParams: { producerSlug: "producerSlug1", exportDate: "2025-01-13" },
            addProducer: true,
            producerName: "Test Producer 1",
            producerSiret: "12345678901",
        },
        {
            name: "donnees-a-integrer2.csv",
            parseParams: { producerSlug: "producerSlug2", exportDate: "2025-01-14" },
            addProducer: true,
            producerName: "Test Producer 2",
            producerSiret: "12345678902",
        },
        {
            name: "donnees-a-integrer3.csv",
            parseParams: { producerSlug: "producerSlug2", exportDate: "2025-01-15" },
            addProducer: false,
        },
    ],
};

describe("scdl data integration script", () => {
    const testFilePath = path.join(SCDL_FILE_PROCESSING_PATH, SCDL_FILE_PROCESSING_CONFIG_FILENAME);

    let addProducerMock: jest.SpyInstance<Promise<void>, [slug: string, name: string, siret: string]>;
    let parseMock: jest.SpyInstance<
        Promise<void>,
        [
            file: string,
            producerSlug: string,
            exportDate: string,
            delimiter?: string | undefined,
            quote?: string | undefined,
        ]
    >;
    let parseXlsMock: jest.SpyInstance<
        Promise<void>,
        [
            file: string,
            producerSlug: string,
            exportDate: string,
            pageName?: string | undefined,
            rowOffset?: string | number | undefined,
        ]
    >;

    beforeEach(() => {
        jest.spyOn(process, "exit").mockImplementation((() => {}) as (code?: any) => never);
        addProducerMock = jest.spyOn(ScdlCli.prototype, "addProducer").mockResolvedValue();
        parseMock = jest.spyOn(ScdlCli.prototype, "parse").mockResolvedValue();
        parseXlsMock = jest.spyOn(ScdlCli.prototype, "parseXls").mockResolvedValue();
    });

    describe("loadConfig method", () => {
        it("should load config file successfully", () => {
            jest.spyOn(fs, "readFileSync").mockReturnValueOnce(JSON.stringify(validConfigData));
            const result = loadConfig();

            expect(result).toEqual(validConfigData);
        });

        it("should throw an error when the JSON file is invalid", () => {
            jest.spyOn(fs, "readFileSync").mockImplementationOnce(() => {
                throw new Error("Unexpected token i in JSON at position 2");
            });

            expect(() => loadConfig()).toThrowError(new Error("Unexpected token i in JSON at position 2"));
        });
    });

    describe("Test for processFile method", () => {
        const fileConfig = {
            name: "donnees-a-integrer1.csv",
            parseParams: { producerSlug: "producerSlug1", exportDate: "2025-01-13" } as ScdlParseArgs,
            addProducer: true,
            producerName: "Test Producer 1",
            producerSiret: "12345678901",
        };

        const fileConfigWrongType = {
            name: "donnees-a-integrer1.doc",
            parseParams: { producerSlug: "producerSlug1", exportDate: "2025-01-13" } as ScdlParseXlsArgs,
            addProducer: true,
            producerName: "Test Producer 1",
            producerSiret: "12345678901",
        };

        it("should process file methods correctly with addProducer called with correct params", async () => {
            await expect(processFile(fileConfig)).resolves.toBeUndefined();

            expect(addProducerMock).toHaveBeenCalledWith(
                fileConfig.parseParams.producerSlug,
                fileConfig.producerName,
                fileConfig.producerSiret,
            );
        });

        it("should process file methods correctly with parse method called with correct params", async () => {
            await expect(processFile(fileConfig)).resolves.toBeUndefined();

            expect(parseMock).toHaveBeenCalledWith(
                expect.stringContaining(fileConfig.name),
                fileConfig.parseParams.producerSlug,
                fileConfig.parseParams.exportDate,
                undefined,
                undefined,
            );
        });

        it("should process file methods correctly with parseXls method not to have been called", async () => {
            await expect(processFile(fileConfig)).resolves.toBeUndefined();
            expect(parseXlsMock).not.toHaveBeenCalled();
        });

        it("should catch error", async () => {
            addProducerMock = jest
                .spyOn(ScdlCli.prototype, "addProducer")
                .mockRejectedValue(new Error("Mocked addProducer error"));
            await expect(processFile(fileConfig)).resolves.toBeUndefined();
        });

        it("should not call parse method when addProducer error", async () => {
            addProducerMock = jest
                .spyOn(ScdlCli.prototype, "addProducer")
                .mockRejectedValue(new Error("Mocked addProducer error"));
            await expect(processFile(fileConfig)).resolves.toBeUndefined();
            expect(parseMock).not.toHaveBeenCalled();
        });

        it("should catch Unsupported file type error", async () => {
            await expect(processFile(fileConfigWrongType)).resolves.toBeUndefined();
        });

        it("should not call parse method when wrong file type", async () => {
            await expect(processFile(fileConfigWrongType)).resolves.toBeUndefined();
            expect(parseMock).not.toHaveBeenCalled();
        });

        it("should not call parseXls method when wrong file type", async () => {
            await expect(processFile(fileConfigWrongType)).resolves.toBeUndefined();
            expect(parseXlsMock).not.toHaveBeenCalled();
        });

        it("should catch Producer already exists error", async () => {
            addProducerMock = jest
                .spyOn(ScdlCli.prototype, "addProducer")
                .mockRejectedValue(new Error("Producer already exists"));

            await expect(processFile(fileConfig)).resolves.toBeUndefined();
        });

        it("should call parse method when producer already exists", async () => {
            addProducerMock = jest
                .spyOn(ScdlCli.prototype, "addProducer")
                .mockRejectedValue(new Error("Producer already exists"));

            await expect(processFile(fileConfig)).resolves.toBeUndefined();
            expect(parseMock).toHaveBeenCalledTimes(1);
        });
    });

    describe("main", () => {
        it("should call ScdlCli methods with correct arguments", async () => {
            jest.spyOn(fs, "readFileSync").mockReturnValueOnce(JSON.stringify(validConfigData));

            await expect(main()).resolves.toBeUndefined();

            expect(addProducerMock).toHaveBeenCalledTimes(2);
            expect(addProducerMock).toHaveBeenCalledWith("producerSlug1", "Test Producer 1", "12345678901");
            expect(addProducerMock).toHaveBeenCalledWith("producerSlug2", "Test Producer 2", "12345678902");

            expect(parseMock).toHaveBeenCalledTimes(3);
            expect(parseMock).toHaveBeenCalledWith(
                path.join(SCDL_FILE_PROCESSING_PATH, "donnees-a-integrer1.csv"),
                "producerSlug1",
                "2025-01-13",
                undefined,
                undefined,
            );
            expect(parseMock).toHaveBeenCalledWith(
                path.join(SCDL_FILE_PROCESSING_PATH, "donnees-a-integrer2.csv"),
                "producerSlug2",
                "2025-01-14",
                undefined,
                undefined,
            );
            expect(parseMock).toHaveBeenCalledWith(
                path.join(SCDL_FILE_PROCESSING_PATH, "donnees-a-integrer3.csv"),
                "producerSlug2",
                "2025-01-15",
                undefined,
                undefined,
            );
            expect(parseXlsMock).not.toHaveBeenCalled();
        });

        it("should throw Unexpected token error", async () => {
            jest.spyOn(fs, "readFileSync").mockImplementationOnce(() => {
                throw new Error("Unexpected token i in JSON at position 2");
            });
            await expect(main()).rejects.toThrow("Unexpected token i in JSON at position 2");
        });

        it("should throw Invalid configuration file error", async () => {
            const invalidConfigData = {
                files: [
                    {
                        name: "donnees-a-integrer1.csv",
                        addProducer: true,
                        producerName: "Test Producer 1",
                        producerSiret: "12345678901",
                    },
                ],
            };
            jest.spyOn(fs, "readFileSync").mockReturnValueOnce(JSON.stringify(invalidConfigData));
            fs.writeFileSync(testFilePath, JSON.stringify(invalidConfigData));

            await expect(main()).rejects.toThrow(
                "Invalid configuration file: The config does not match the expected structure.",
            );
        });

        it("when error with one file, should process continue for other files", async () => {
            const configData = {
                files: [
                    {
                        name: "donnees-a-integrer1.xlsx",
                        parseParams: { producerSlug: "producerSlug1", exportDate: "2025-01-13" } as ScdlParseXlsArgs,
                        addProducer: true,
                        producerName: "Test Producer 1",
                        producerSiret: "12345678901",
                    },
                    {
                        name: "donnees-a-integrer2.csv",
                        parseParams: { producerSlug: "producerSlug2", exportDate: "2025-01-14" } as ScdlParseArgs,
                        addProducer: true,
                        producerName: "Test Producer 2",
                        producerSiret: "12345678902",
                    },
                    {
                        name: "donnees-a-integrer3.csv",
                        parseParams: { producerSlug: "producerSlug3", exportDate: "2025-01-15" } as ScdlParseArgs,
                        addProducer: true,
                        producerName: "Test Producer 3",
                        producerSiret: "12345678903",
                    },
                ],
            };
            jest.spyOn(fs, "readFileSync").mockReturnValueOnce(JSON.stringify(configData));
            parseXlsMock = jest
                .spyOn(ScdlCli.prototype, "parseXls")
                .mockRejectedValue(new Error("Mocked addProducer error"));

            await expect(main()).resolves.toBeUndefined();
            expect(addProducerMock).toHaveBeenCalledTimes(3);
            expect(parseMock).toHaveBeenCalledTimes(2);
            expect(parseXlsMock).toHaveBeenCalledTimes(1);
        });
    });
});

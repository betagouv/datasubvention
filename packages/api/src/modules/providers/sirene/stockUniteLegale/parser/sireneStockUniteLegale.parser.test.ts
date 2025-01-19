import SireneStockUniteLegaleParser from "./sireneStockUniteLegale.parser";
import fs, { createReadStream, ReadStream } from "fs";
import csv from "csv-parser";
import { DTOS, DBOS, ENTITIES } from "../../__fixtures__/sireneStockUniteLegale.fixture";
import SireneStockUniteLegaleAdapter from "../adapter/sireneStockUniteLegale.adapter";

jest.mock("fs", () => {
    const actualFs = jest.requireActual("fs");
    return {
        ...actualFs,
        existsSync: jest.fn().mockReturnValue(true),
        createReadStream: jest.fn(),
    };
});

jest.mock("csv-parser");

const DTOS_BEING_ASSOCIATIONS = 2;

describe("SireneStockUniteLegaleParser", () => {
    describe("filePathValidator", () => {
        it("should throw an error if file is not provided", () => {
            expect(() => SireneStockUniteLegaleParser.filePathValidator("")).toThrowError(
                "Parse command need file args",
            );
        });
        it("should call fs.existsSync if a filePath is given", () => {
            const filePath = "file";
            SireneStockUniteLegaleParser.filePathValidator(filePath);
            expect(fs.existsSync).toHaveBeenCalledWith(filePath);
        });

        it("should throw an error if file does not exist", () => {
            jest.mocked(fs.existsSync).mockReturnValueOnce(false);
            expect(() => SireneStockUniteLegaleParser.filePathValidator("file")).toThrowError("File not found file");
        });

        it("should return true if file exists", () => {
            expect(SireneStockUniteLegaleParser.filePathValidator("file")).toBe(true);
        });
    });

    describe("parseCsvAndInsert", () => {
        let mockFilePathValidator: jest.SpyInstance;
        let mockDtoToEntity: jest.SpyInstance;
        let mockIsToInclude: jest.SpyInstance;
        let mockInsertMany: jest.SpyInstance;
        let filePath = "file";
        let mockStream: ReadStream;
        beforeAll(() => {
            jest.useFakeTimers();
            mockFilePathValidator = jest.spyOn(SireneStockUniteLegaleParser, "filePathValidator").mockReturnValue(true);
            mockDtoToEntity = jest.spyOn(SireneStockUniteLegaleAdapter, "dtoToEntity").mockReturnValue(ENTITIES[0]);
            mockInsertMany = jest.spyOn(SireneStockUniteLegaleAdapter, "entityToDbo").mockReturnValue(DBOS[0]);
            mockStream = {
                pipe: jest.fn().mockReturnThis(),
                on: jest.fn().mockImplementation((event, cb) => {
                    if (event === "data") {
                        cb(DTOS[0]);
                        cb(DTOS[1]);
                        cb(DTOS[2]);
                    }
                    if (event === "end") {
                        cb();
                    }
                    return mockStream;
                }),
                pause: jest.fn(),
                resume: jest.fn(),
                error: jest.fn(),
            } as unknown as ReadStream;
            jest.mocked(createReadStream).mockReturnValue(mockStream);
        });

        beforeEach(() => {
            let callCount = 0;
            mockIsToInclude = jest.spyOn(SireneStockUniteLegaleParser, "isToInclude").mockImplementation(() => {
                callCount++;
                if (callCount > DTOS_BEING_ASSOCIATIONS) {
                    return false;
                }
                return true;
            });
        });

        afterAll(() => {
            jest.useRealTimers();
            jest.restoreAllMocks();
        });

        it("should call filePathValidator", async () => {
            await SireneStockUniteLegaleParser.parseCsvAndInsert(filePath);
            expect(mockFilePathValidator).toHaveBeenCalledWith(filePath);
        });

        it("should call fs.createReadStream with the filePath", async () => {
            await SireneStockUniteLegaleParser.parseCsvAndInsert(filePath);
            expect(fs.createReadStream).toHaveBeenCalledWith(filePath);
        });

        it("should call csv", async () => {
            await SireneStockUniteLegaleParser.parseCsvAndInsert(filePath);
            expect(csv).toHaveBeenCalledTimes(1);
        });

        it("should call isToInclude", async () => {
            await SireneStockUniteLegaleParser.parseCsvAndInsert(filePath);
            expect(mockIsToInclude).toHaveBeenCalledTimes(DTOS.length);
        });

        it("should call sireneStockUniteLegaleService.insertMany", async () => {
            await SireneStockUniteLegaleParser.parseCsvAndInsert(filePath);
            expect(mockInsertMany).toHaveBeenCalledTimes(Math.floor(DTOS_BEING_ASSOCIATIONS / 1000));
        });

        it("should call dtoToEntity", async () => {
            await SireneStockUniteLegaleParser.parseCsvAndInsert(filePath);
            expect(mockDtoToEntity).toHaveBeenCalledTimes(DTOS_BEING_ASSOCIATIONS);
        });
        it("should call stream.pause", async () => {
            await SireneStockUniteLegaleParser.parseCsvAndInsert(filePath);
            expect(mockStream.pause).toHaveBeenCalledTimes(DTOS_BEING_ASSOCIATIONS);
        });

        it("should call stream.resume", async () => {
            await SireneStockUniteLegaleParser.parseCsvAndInsert(filePath);
            expect(mockStream.resume).toHaveBeenCalledTimes(DTOS_BEING_ASSOCIATIONS);
        });

        it("should return a promise if no error occurs", async () => {
            const result = SireneStockUniteLegaleParser.parseCsvAndInsert(filePath);
            expect(result).toBeInstanceOf(Promise);
        });

        it("should throw an error if an error occurs", async () => {
            mockStream.on = jest.fn().mockImplementation((event, cb) => {
                if (event === "error") {
                    cb(new Error("error"));
                }
                return mockStream;
            });
            await expect(SireneStockUniteLegaleParser.parseCsvAndInsert(filePath)).rejects.toThrowError("error");
        });
    });
});

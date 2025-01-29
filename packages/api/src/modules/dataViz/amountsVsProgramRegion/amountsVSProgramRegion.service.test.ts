import {
    PAYMENT_FLAT_ENTITY_WITH_NULLS,
    PAYMENT_FLAT_ENTITY,
} from "../../../dataProviders/db/paymentFlat/__fixtures__/paymentFlatEntity.fixture";
import paymentFlatService from "../../paymentFlat/paymentFlat.service";
import amountsVsProgrammeRegionService from "./amountsVsProgramRegion.service";
import AmountsVsProgrammeRegionAdapter from "./amountsVsProgramRegion.adapter";
import {
    AMOUNTS_VS_PROGRAM_REGION_ENTITIES,
    NOT_AGGREGATED_ENTITIES,
} from "./__fixtures__/amountsVSProgramRegion.fixture";
import amountsVsProgrammeRegionPort from "../../../dataProviders/db/dataViz/amountVSProgramRegion/amountsVsProgramRegion.port";

describe("amountsVSProgrammeRegionService", () => {
    describe("toAmountsVsProgrammeRegionEntities", () => {
        let mockAdapter: jest.SpyInstance;
        let mockCursorFindChorusOnly: jest.SpyInstance;

        let mockCursor;
        let mockDocuments;
        let nDocuments;

        beforeEach(() => {
            mockDocuments = [
                PAYMENT_FLAT_ENTITY,
                { ...PAYMENT_FLAT_ENTITY, amount: 7000 },
                PAYMENT_FLAT_ENTITY_WITH_NULLS,
            ];
            nDocuments = mockDocuments.length;

            mockCursor = {
                next: jest.fn().mockImplementation(() => {
                    return mockDocuments.shift();
                }),
                hasNext: jest.fn().mockImplementation(() => {
                    if (mockDocuments.length) return true;
                    return false;
                }),
            };

            mockCursorFindChorusOnly = jest
                .spyOn(paymentFlatService, "cursorFindChorusOnly")
                .mockReturnValue(mockCursor);

            mockAdapter = jest.spyOn(AmountsVsProgrammeRegionAdapter, "toNotAggregatedEntity");
            //* NOT_AGGREGATED_ENTITIES[1] has the same agregation key (program, budgetExercice, region)
            // of NOT_AGGREGATED_ENTITIES[0]
            // and toNotAggregatedEntity is called only for new key
            mockAdapter.mockReturnValueOnce(NOT_AGGREGATED_ENTITIES[0]);
            mockAdapter.mockReturnValueOnce(NOT_AGGREGATED_ENTITIES[2]);
            mockAdapter.mockReturnValue(undefined);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("should call cursorFindChorusOnly with the budget exercice", async () => {
            const exerciceBudgetaire = 2020;
            await amountsVsProgrammeRegionService.toAmountsVsProgrammeRegionEntities(exerciceBudgetaire);

            expect(mockCursorFindChorusOnly).toHaveBeenCalledWith(exerciceBudgetaire);
        });

        it("should call cursorFindChorusOnly without the budget exercice", async () => {
            await amountsVsProgrammeRegionService.toAmountsVsProgrammeRegionEntities();

            expect(mockCursorFindChorusOnly).toHaveBeenCalledWith(undefined);
        });

        it("should call hasNext nDocuments + 1 times", async () => {
            await amountsVsProgrammeRegionService.toAmountsVsProgrammeRegionEntities();

            expect(mockCursor.hasNext).toHaveBeenCalledTimes(nDocuments + 1);
        });

        it("should call cursor.next nDocuments times", async () => {
            await amountsVsProgrammeRegionService.toAmountsVsProgrammeRegionEntities();

            expect(mockCursor.next).toHaveBeenCalledTimes(nDocuments);
        });

        it("should call toNotAggregatedEntity for each first time occurrence of agregation key (program, year,region)", async () => {
            await amountsVsProgrammeRegionService.toAmountsVsProgrammeRegionEntities();

            expect(mockAdapter).toHaveBeenCalledTimes(AMOUNTS_VS_PROGRAM_REGION_ENTITIES.length);
        });

        it("should return the right entities", async () => {
            const actual = await amountsVsProgrammeRegionService.toAmountsVsProgrammeRegionEntities();
            const expected = AMOUNTS_VS_PROGRAM_REGION_ENTITIES;

            expect(actual).toEqual(expected);
        });
    });

    describe("init", () => {
        let mockToAmountsVsProgrammeRegionEntities: jest.SpyInstance;
        let mockInsertMany: jest.SpyInstance;

        beforeEach(() => {
            mockToAmountsVsProgrammeRegionEntities = jest
                .spyOn(amountsVsProgrammeRegionService, "toAmountsVsProgrammeRegionEntities")
                .mockResolvedValue(AMOUNTS_VS_PROGRAM_REGION_ENTITIES);

            mockInsertMany = jest.spyOn(amountsVsProgrammeRegionPort, "insertMany").mockImplementation(jest.fn());
        });

        afterAll(() => {
            jest.restoreAllMocks();
        });

        it("should call toAmountsVsProgrammeRegionEntities", async () => {
            await amountsVsProgrammeRegionService.init();

            expect(mockToAmountsVsProgrammeRegionEntities).toHaveBeenCalledTimes(1);
        });

        it("should call insertMany with the right entities", async () => {
            await amountsVsProgrammeRegionService.init();

            expect(mockInsertMany).toHaveBeenCalledWith(AMOUNTS_VS_PROGRAM_REGION_ENTITIES);
        });
    });

    describe("updateCollection", () => {
        let mockToAmountsVsProgrammeRegionEntities: jest.SpyInstance;
        let mockUpsertMany: jest.SpyInstance;

        beforeEach(() => {
            mockToAmountsVsProgrammeRegionEntities = jest
                .spyOn(amountsVsProgrammeRegionService, "toAmountsVsProgrammeRegionEntities")
                .mockResolvedValue(AMOUNTS_VS_PROGRAM_REGION_ENTITIES);

            mockUpsertMany = jest.spyOn(amountsVsProgrammeRegionPort, "upsertMany").mockImplementation(jest.fn());
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("should call toAmountsVsProgrammeRegionEntities without ExcerciceBudgetaire", async () => {
            await amountsVsProgrammeRegionService.updateCollection();

            expect(mockToAmountsVsProgrammeRegionEntities).toHaveBeenCalledWith(undefined);
        });

        it("should call toAmountsVsProgrammeRegionEntities with ExcerciceBudgetaire", async () => {
            const exerciceBudgetaire = 2020;
            await amountsVsProgrammeRegionService.updateCollection(exerciceBudgetaire);

            expect(mockToAmountsVsProgrammeRegionEntities).toHaveBeenCalledWith(exerciceBudgetaire);
        });

        it("should call upsertMany with the right entities", async () => {
            await amountsVsProgrammeRegionService.updateCollection();

            expect(mockUpsertMany).toHaveBeenCalledWith(AMOUNTS_VS_PROGRAM_REGION_ENTITIES);
        });
    });

    describe("isCollectionInitialized", () => {
        let mockHasBeenInitialized: jest.SpyInstance;

        beforeEach(() => {
            mockHasBeenInitialized = jest
                .spyOn(amountsVsProgrammeRegionPort, "hasBeenInitialized")
                .mockReturnValue(Promise.resolve(true));
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("should call hasBeenInitialized", async () => {
            await amountsVsProgrammeRegionService.isCollectionInitialized();

            expect(mockHasBeenInitialized).toHaveBeenCalledTimes(1);
        });
    });
});

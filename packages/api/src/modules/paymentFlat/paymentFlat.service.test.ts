import dataBretagneService from "../providers/dataBretagne/dataBretagne.service";
import { RECORDS } from "./__fixtures__/dataBretagne.fixture";
import { ENTITIES } from "../providers/chorus/__fixtures__/ChorusFixtures";

import paymentFlatService from "./paymentFlat.service";
import chorusService from "../providers/chorus/chorus.service";
import PaymentFlatAdapter from "./paymentFlatAdapter";
import { PAYMENT_FLAT_ENTITY, PAYMENT_FROM_PAYMENT_FLAT_DBO } from "./__fixtures__/paymentFlatEntity.fixture";
import {
    LIST_PAYMENT_FLAT_DBO,
    PAYMENT_FLAT_DBO,
} from "../../dataProviders/db/paymentFlat/__fixtures__/paymentFlatDbo.fixture";

import paymentFlatPort from "../../dataProviders/db/paymentFlat/paymentFlat.port";
import PaymentFlatAdapterDbo from "../../dataProviders/db/paymentFlat/PaymentFlat.adapter";
import Siren from "../../valueObjects/Siren";
import AssociationIdentifier from "../../valueObjects/AssociationIdentifier";

jest.mock("../providers/dataBretagne/dataBretagne.service", () => ({
    getMinistriesRecord: jest.fn(),
    findProgramsRecord: jest.fn(),
    getDomaineFonctRecord: jest.fn(),
    getRefProgrammationRecord: jest.fn(),
}));
const mockDataBretagneService = jest.mocked(dataBretagneService);
jest.mock("./paymentFlatAdapter");
jest.mock("../../dataProviders/db/paymentFlat/paymentFlat.port");

const allDataBretagneDataResolvedValue = {
    programs: RECORDS["programme"],
    ministries: RECORDS["ministry"],
    domainesFonct: RECORDS["domaineFonct"],
    refsProgrammation: RECORDS["refProgrammation"],
};

describe("PaymentFlatService", () => {
    describe("getAllDataBretagneData", () => {
        beforeAll(() => {
            mockDataBretagneService.getMinistriesRecord.mockResolvedValue(RECORDS["ministry"]);
            mockDataBretagneService.findProgramsRecord.mockResolvedValue(RECORDS["programme"]);
            mockDataBretagneService.getDomaineFonctRecord.mockResolvedValue(RECORDS["domaineFonct"]);
            mockDataBretagneService.getRefProgrammationRecord.mockResolvedValue(RECORDS["refProgrammation"]);
        });

        afterAll(() => {
            jest.restoreAllMocks();
        });

        it("should return all data from dataBretagneService", async () => {
            //@ts-expect-error : private methode
            const result = await paymentFlatService.getAllDataBretagneData();
            const expected = allDataBretagneDataResolvedValue;
            expect(result).toEqual(expected);
        });

        it.each(["getMinistriesRecord", "findProgramsRecord", "getDomaineFonctRecord", "getRefProgrammationRecord"])(
            "should call %s",
            async methodName => {
                //@ts-expect-error : private methode
                await paymentFlatService.getAllDataBretagneData();
                expect(mockDataBretagneService[methodName]).toHaveBeenCalledTimes(1);
            },
        );
    });

    describe("isCollectionInitialized", () => {
        it("calls port.hasBeenInitialized", () => {
            paymentFlatService.isCollectionInitialized();
            expect(paymentFlatPort.hasBeenInitialized).toHaveBeenCalledTimes(1);
        });
    });

    describe("toPaymentFlatChorusEntities", () => {
        let mockChorusCursorFind: jest.SpyInstance;
        let mockToNotAggregatedChorusPaymentFlatEntity: jest.SpyInstance;

        let mockCursor;
        let mockDocuments;
        let nDocuments;

        beforeEach(() => {
            mockDocuments = [ENTITIES[1], ENTITIES[0]];

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

            mockChorusCursorFind = jest
                .spyOn(chorusService, "cursorFindDataWithoutHash")
                .mockReturnValue(mockCursor as any);
            mockToNotAggregatedChorusPaymentFlatEntity = jest
                .spyOn(PaymentFlatAdapter, "toNotAggregatedChorusPaymentFlatEntity")
                .mockReturnValue({ ...PAYMENT_FLAT_ENTITY });
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("should call chorusCursorFind with no argument", async () => {
            await paymentFlatService.toPaymentFlatChorusEntities(
                RECORDS["programme"],
                RECORDS["ministry"],
                RECORDS["domaineFonct"],
                RECORDS["refProgrammation"],
            );
            expect(mockChorusCursorFind).toHaveBeenCalledWith();
        });

        it("should call chorusCursorFind with exercice", async () => {
            const exercice = 2022;
            await paymentFlatService.toPaymentFlatChorusEntities(
                RECORDS["programme"],
                RECORDS["ministry"],
                RECORDS["domaineFonct"],
                RECORDS["refProgrammation"],
                exercice,
            );
            expect(mockChorusCursorFind).toHaveBeenCalledWith(exercice);
        });

        it(`calls next for $nDocuments times`, async () => {
            await paymentFlatService.toPaymentFlatChorusEntities(
                RECORDS["programme"],
                RECORDS["ministry"],
                RECORDS["domaineFonct"],
                RECORDS["refProgrammation"],
            );
            expect(mockCursor.next).toHaveBeenCalledTimes(nDocuments);
        });

        it("calls adapter.toNotAggregatedChorusPaymentFlatEntity for each documents", async () => {
            await paymentFlatService.toPaymentFlatChorusEntities(
                RECORDS["programme"],
                RECORDS["ministry"],
                RECORDS["domaineFonct"],
                RECORDS["refProgrammation"],
            );
            expect(mockToNotAggregatedChorusPaymentFlatEntity).toHaveBeenCalledTimes(nDocuments);
        });

        it("should return an array of PaymentFlatEntity", async () => {
            const result = await paymentFlatService.toPaymentFlatChorusEntities(
                RECORDS["programme"],
                RECORDS["ministry"],
                RECORDS["domaineFonct"],
                RECORDS["refProgrammation"],
            );
            const expected = [{ ...PAYMENT_FLAT_ENTITY, amount: PAYMENT_FLAT_ENTITY.amount * 2 }];
            expect(result).toEqual(expected);
        });
    });

    describe("updatePaymentsFlatCollection", () => {
        let mockToPaymentFlatChorusEntities: jest.SpyInstance;
        let mockUpsertMany: jest.SpyInstance;
        let mockGetAllDataBretagneData: jest.SpyInstance;
        let mockEntities;
        let mockToDbo: jest.SpyInstance;

        beforeEach(() => {
            //@ts-expect-error : private methode
            mockGetAllDataBretagneData = jest.spyOn(paymentFlatService, "getAllDataBretagneData");
            mockGetAllDataBretagneData.mockResolvedValue(allDataBretagneDataResolvedValue);
            mockToDbo = jest.spyOn(PaymentFlatAdapterDbo, "toDbo");
            mockToDbo.mockReturnValue(PAYMENT_FLAT_DBO);
            mockEntities = [PAYMENT_FLAT_ENTITY, { ...PAYMENT_FLAT_ENTITY, exerciceBudgetaire: 2022 }];
            mockToPaymentFlatChorusEntities = jest
                .spyOn(paymentFlatService, "toPaymentFlatChorusEntities")
                .mockResolvedValue(mockEntities);
            mockUpsertMany = jest.spyOn(paymentFlatPort, "upsertMany").mockImplementation(jest.fn());
        });
        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("calls getAllDataBretagneData once", async () => {
            await paymentFlatService.updatePaymentsFlatCollection();
            expect(mockGetAllDataBretagneData).toHaveBeenCalledTimes(1);
        });

        it("calls toPaymentFlatChorusEntities with all data from dataBretagneService", async () => {
            await paymentFlatService.updatePaymentsFlatCollection();
            expect(mockToPaymentFlatChorusEntities).toHaveBeenCalledWith(
                RECORDS["programme"],
                RECORDS["ministry"],
                RECORDS["domaineFonct"],
                RECORDS["refProgrammation"],
                undefined,
            );
        });

        it("should call toPaymentFlatChorusEntities with all data from dataBretagneService and exerciceBudgetaire", async () => {
            const exerciceBudgetaire = 2022;
            await paymentFlatService.updatePaymentsFlatCollection(exerciceBudgetaire);
            expect(mockToPaymentFlatChorusEntities).toHaveBeenCalledWith(
                RECORDS["programme"],
                RECORDS["ministry"],
                RECORDS["domaineFonct"],
                RECORDS["refProgrammation"],
                exerciceBudgetaire,
            );
        });

        it("should call toDbo for each entity", async () => {
            await paymentFlatService.updatePaymentsFlatCollection();
            expect(mockToDbo).toHaveBeenCalledWith(PAYMENT_FLAT_ENTITY);
        });

        it("should call upsertMany for each batch", async () => {
            // @ts-expect-error: private var
            paymentFlatService.BATCH_SIZE = 2;
            const ENTITIES: Record<string, any> = [];

            // create array corresponing to 3 batch
            // @ts-expect-error: access private var
            for (let i = 0; i < paymentFlatService.BATCH_SIZE + 1; i++) {
                ENTITIES.push({ uniqueId: i });
            }

            console.log(ENTITIES);

            const updateDbo = PAYMENT_FLAT_DBO;
            const { _id, ...DboWithoutId } = updateDbo;
            const buildExpectedOps = entity => {
                return {
                    updateOne: {
                        filter: { uniqueId: DboWithoutId.uniqueId },
                        update: { $set: DboWithoutId },
                        upsert: true,
                    },
                };
            };
            const EXPECTED_CALLS = [
                [buildExpectedOps(ENTITIES[0]), buildExpectedOps(ENTITIES[1])],
                [buildExpectedOps(ENTITIES[2])],
            ];

            mockToPaymentFlatChorusEntities.mockResolvedValueOnce(ENTITIES);
            await paymentFlatService.updatePaymentsFlatCollection();

            expect(mockUpsertMany).toHaveBeenNthCalledWith(1, EXPECTED_CALLS[0]);
            expect(mockUpsertMany).toHaveBeenNthCalledWith(2, EXPECTED_CALLS[1]);
        });
    });

    describe("cursorFindChorusOnly", () => {
        it("should call chorusLinePort.cursorFindChorusOnly with undefined", () => {
            paymentFlatService.cursorFindChorusOnly();
            expect(paymentFlatPort.cursorFindChorusOnly).toHaveBeenCalledWith(undefined);
        });

        it("should call chorusLinePort.findData with exerciceBudgetaire", () => {
            const exerciceBudgetaire = 2021;
            paymentFlatService.cursorFindChorusOnly(exerciceBudgetaire);
            expect(paymentFlatPort.cursorFindChorusOnly).toHaveBeenCalledWith(exerciceBudgetaire);
        });
    });

    describe("rawToPayment", () => {
        it("should call PaymentFlatAdapter", () => {
            // @ts-expect-error: parameter type
            const rawGrant = { data: PAYMENT_FLAT_DBO } as RawGrant;
            paymentFlatService.rawToPayment(rawGrant);
            expect(PaymentFlatAdapter.rawToPayment).toHaveBeenCalledWith(rawGrant);
        });

        it("should return ChorusPayment", () => {
            // @ts-expect-error: parameter type
            const rawGrant = { data: PAYMENT_FLAT_DBO } as RawGrant;
            jest.mocked(PaymentFlatAdapter.rawToPayment).mockReturnValueOnce(PAYMENT_FROM_PAYMENT_FLAT_DBO);
            const expected = PAYMENT_FROM_PAYMENT_FLAT_DBO;
            const actual = paymentFlatService.rawToPayment(rawGrant);
            expect(actual).toEqual(expected);
        });
    });

    describe("toPaymentArray", () => {
        it("should call toPayment for each entity", () => {
            // @ts-expect-error: test private method
            paymentFlatService.toPaymentArray(LIST_PAYMENT_FLAT_DBO);
            LIST_PAYMENT_FLAT_DBO.forEach((entity, index) => {
                expect(PaymentFlatAdapter.toPayment).toHaveBeenNthCalledWith(index + 1, entity);
            });
        });
    });

    describe("raw grant", () => {
        const DATA = [{ ej: "EJ" }];

        describe("getRawGrants", () => {
            const SIREN = new Siren("123456789");
            const IDENTIFIER = AssociationIdentifier.fromSiren(SIREN);
            let findBySirenMock;
            beforeAll(
                () =>
                    (findBySirenMock = jest
                        .spyOn(paymentFlatPort, "findBySiren")
                        // @ts-expect-error: mock
                        .mockImplementation(jest.fn(() => DATA))),
            );
            afterAll(() => findBySirenMock.mockRestore());

            it("should call findBySiren()", async () => {
                await paymentFlatService.getRawGrants(IDENTIFIER);
            });

            it("returns raw grant data", async () => {
                const actual = await paymentFlatService.getRawGrants(IDENTIFIER);
                expect(actual).toMatchInlineSnapshot(`
                    Array [
                      Object {
                        "data": Object {
                          "ej": "EJ",
                        },
                        "joinKey": "EJ",
                        "provider": "paymentflat",
                        "type": "payment",
                      },
                    ]
                `);
            });
        });
    });
});

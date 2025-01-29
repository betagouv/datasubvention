import { ObjectId } from "mongodb";
import amountsVsProgrammeRegionPort from "../../../src/dataProviders/db/dataViz/amountVSProgramRegion/amountsVsProgramRegion.port";
import { PAYMENT_FLAT_DBO } from "../../../src/dataProviders/db/paymentFlat/__fixtures__/paymentFlatDbo.fixture";
import paymentFlatPort from "../../../src/dataProviders/db/paymentFlat/paymentFlat.port";
import AmountsVsProgrammeRegionCli from "../../../src/interfaces/cli/AmountsVsProgramRegion.cli";

const MOCK_DOCUMENTS = [
    { ...PAYMENT_FLAT_DBO, provider: "chorus", uniqueId: "1" },
    { ...PAYMENT_FLAT_DBO, montant: 7000, provider: "chorus", uniqueId: "2" },
    { ...PAYMENT_FLAT_DBO, montant: 100_000, numeroProgramme: "1234", provider: "chorus", uniqueId: "3" },
    {
        ...PAYMENT_FLAT_DBO,
        montant: 34_000,
        attachementComptable: "HNOR",
        exerciceBudgetaire: 2021,
        provider: "chorus",
        uniqueId: "4",
    },
];

const insertData = async () => {
    const bulkWriteArray = MOCK_DOCUMENTS.map(dbo => {
        const { _id, ...DboWithoutId } = dbo;
        return {
            updateOne: {
                filter: { uniqueId: DboWithoutId.uniqueId },
                update: { $set: DboWithoutId },
                upsert: true,
            },
        };
    });

    await paymentFlatPort.upsertMany(bulkWriteArray);
};

function sortResultForSnapshot(a, b) {
    if (a.regionAttachementComptable < b.regionAttachementComptable) return -1;
    if (a.regionAttachementComptable > b.regionAttachementComptable) return 1;
    if (a.programme < b.programme) return -1;
    if (a.programme > b.programme) return 1;

    return a.exerciceBudgetaire - b.exerciceBudgetaire;
}

describe("AmountsVsProgrammeRegionCli", () => {
    beforeEach(async () => {
        await amountsVsProgrammeRegionPort.deleteAll();
        await insertData();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    let cli = new AmountsVsProgrammeRegionCli();

    describe("init()", () => {
        it("should persist amounts vs programme region collection", async () => {
            await cli.init();
            //@ts-expect-error protected method
            const amountsVsProgrammeRegion = (await amountsVsProgrammeRegionPort.collection.find({}).toArray())
                .map(amountsVsProgrammeRegion => ({
                    ...amountsVsProgrammeRegion,
                    _id: expect.any(ObjectId),
                }))
                .sort(sortResultForSnapshot);

            expect(amountsVsProgrammeRegion).toMatchSnapshot("Snapshot init");
        });
    });

    describe("resyncExercice()", () => {
        it("should persist amounts vs programme region collection for the given exercice", async () => {
            const exercice = 2023;
            await cli.resyncExercice(exercice);
            //@ts-expect-error protected method
            const amountsVsProgrammeRegion = (await amountsVsProgrammeRegionPort.collection.find({}).toArray())
                .map(amountsVsProgrammeRegion => ({
                    ...amountsVsProgrammeRegion,
                    _id: expect.any(ObjectId),
                }))
                .sort(sortResultForSnapshot);

            expect(amountsVsProgrammeRegion).toMatchSnapshot("Snapshot resyncExercice");
        });
    });
});

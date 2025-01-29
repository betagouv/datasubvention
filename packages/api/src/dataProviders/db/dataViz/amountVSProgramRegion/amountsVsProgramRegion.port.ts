import { AmountsVsProgrammeRegionDbo } from "../../../../modules/dataViz/amountsVsProgramRegion/entitiyAndDbo/amountsVsProgramRegion.dbo";
import AmountsVsProgrammeRegionEntity from "../../../../modules/dataViz/amountsVsProgramRegion/entitiyAndDbo/amountsVsProgramRegion.entity";
import MongoPort from "../../../../shared/MongoPort";
import AmountsVsProgrammeRegionAdapter from "./amountsVsProgramRegion.adapter";

export class AmountsVsProgrammeRegionPort extends MongoPort<AmountsVsProgrammeRegionDbo> {
    collectionName = "dv--montant-programme-region";

    public async createIndexes(): Promise<void> {
        await this.collection.createIndex({ regionAttachementComptable: 1 });
        await this.collection.createIndex({ programme: 1 });
        await this.collection.createIndex({ exerciceBudgetaire: 1 });
        await this.collection.createIndex(
            { regionAttachementComptable: 1, programme: 1, exerciceBudgetaire: 1 },
            { unique: true },
        );
    }

    public async hasBeenInitialized() {
        const dbo = await this.collection.findOne({});
        return !!dbo;
    }

    public insertOne(entity: AmountsVsProgrammeRegionEntity) {
        return this.collection.insertOne(AmountsVsProgrammeRegionAdapter.toDbo(entity));
    }

    public upsertOne(entity: AmountsVsProgrammeRegionEntity) {
        const updateDbo = AmountsVsProgrammeRegionAdapter.toDbo(entity);
        const { _id, ...DboWithoutId } = updateDbo;
        return this.collection.updateOne(
            {
                regionAttachementComptable: updateDbo.regionAttachementComptable,
                programme: updateDbo.programme,
                exerciceBudgetaire: updateDbo.exerciceBudgetaire,
            },
            { $set: DboWithoutId },
            { upsert: true },
        );
    }

    public insertMany(entities: AmountsVsProgrammeRegionEntity[]) {
        return this.collection.insertMany(
            entities.map(entity => AmountsVsProgrammeRegionAdapter.toDbo(entity), { ordered: false }),
        );
    }

    public upsertMany(entities: AmountsVsProgrammeRegionEntity[]) {
        const bulkWriteArray = entities.map(entity => {
            const updateDbo = AmountsVsProgrammeRegionAdapter.toDbo(entity);
            const { _id, ...DboWithoutId } = updateDbo;
            return {
                updateOne: {
                    filter: {
                        regionAttachementComptable: updateDbo.regionAttachementComptable,
                        programme: updateDbo.programme,
                        exerciceBudgetaire: updateDbo.exerciceBudgetaire,
                    },
                    update: { $set: DboWithoutId },
                    upsert: true,
                },
            };
        });

        return this.collection.bulkWrite(bulkWriteArray, { ordered: false });
    }

    public async findAll() {
        return (await this.collection.find({})).toArray();
    }

    public async deleteAll() {
        await this.collection.deleteMany({});
    }
}

const amountsVsProgrammeRegionPort = new AmountsVsProgrammeRegionPort();
export default amountsVsProgrammeRegionPort;

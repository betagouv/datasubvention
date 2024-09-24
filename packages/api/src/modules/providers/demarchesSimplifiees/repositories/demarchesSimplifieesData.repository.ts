import { Siren, Siret } from "dto";
import { UnorderedBulkOperation } from "mongodb";
import MongoRepository from "../../../../shared/MongoRepository";
import DemarchesSimplifieesDataEntity from "../entities/DemarchesSimplifieesDataEntity";

export class DemarchesSimplifieesDataRepository extends MongoRepository<DemarchesSimplifieesDataEntity> {
    collectionName = "demarches-simplifiees-data";
    private bulk: UnorderedBulkOperation | undefined;

    async createIndexes() {
        await this.collection.createIndex({ "demande.id": 1 }, { unique: true });
        await this.collection.createIndex({ siret: 1 });
    }

    initBulk() {
        this.bulk = this.collection.initializeUnorderedBulkOp();
    }

    stackUpsert(entity: DemarchesSimplifieesDataEntity) {
        if (!this.bulk) throw new Error("please call 'initCall' before calling 'stackUpsert'");
        this.bulk
            .find({
                "demande.id": entity.demande.id,
            })
            .upsert()
            .updateOne({ $set: entity as Partial<DemarchesSimplifieesDataEntity> });
    }

    async executeBulk() {
        if (!this.bulk) throw new Error("please call 'initCall' and stack operations before calling 'stackUpsert'");
        const res = await this.bulk.execute();
        this.bulk = undefined; // bulk can not be executed twice without being reset anyway
        return res;
    }

    async upsert(entity: DemarchesSimplifieesDataEntity) {
        await this.collection.updateOne(
            {
                "demande.id": entity.demande.id,
            },
            { $set: entity as Partial<DemarchesSimplifieesDataEntity> },
            { upsert: true },
        );
    }

    findBySiret(siret: Siret) {
        return this.collection.find({ siret }).toArray();
    }

    findBySiren(siren: Siren) {
        return this.collection.find({ siret: new RegExp(`^${siren}\\d{5}`) }, { projection: { _id: 0 } }).toArray();
    }
}

const demarchesSimplifieesDataRepository = new DemarchesSimplifieesDataRepository();

export default demarchesSimplifieesDataRepository;

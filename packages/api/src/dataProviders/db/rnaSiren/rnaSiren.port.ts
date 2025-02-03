import Siren from "../../../valueObjects/Siren";
import Rna from "../../../valueObjects/Rna";
import { isMongoDuplicateError } from "../../../shared/helpers/MongoHelper";
import RnaSirenEntity from "../../../entities/RnaSirenEntity";
import MongoPort from "../../../shared/MongoPort";
import RnaSirenAdapter from "./RnaSiren.adapter";
import RnaSirenDbo from "./RnaSirenDbo";

export class RnaSirenPort extends MongoPort<RnaSirenDbo> {
    collectionName = "rna-siren";

    async createIndexes() {
        await this.collection.createIndex({ rna: 1 });
        await this.collection.createIndex({ siren: 1 });
        await this.collection.createIndex({ rna: 1, siren: 1 }, { unique: true });
    }

    async insertMany(entities: RnaSirenEntity[]) {
        if (!entities.length) return;
        try {
            await this.collection.insertMany(
                entities.map(e => RnaSirenAdapter.toDbo(e)),
                { ordered: false },
            );
        } catch (e: unknown) {
            if (isMongoDuplicateError(e)) {
                // One or many entities already exist in database but other entities have been saved
                return; // we can safely ignore it
            }
            throw e;
        }
    }

    async insert(entity: RnaSirenEntity) {
        try {
            await this.collection.insertOne(RnaSirenAdapter.toDbo(entity));
        } catch (e: unknown) {
            if (isMongoDuplicateError(e)) {
                // One or many entities already exist in database but other entities have been saved
                return; // we can safely ignore it
            }
            throw e;
        }
    }

    async find(id: Rna | Siren) {
        let dbos: RnaSirenDbo[] = [];
        let rnaSirenToFind;

        if (id instanceof Rna) rnaSirenToFind = { rna: id.value };
        else if (id instanceof Siren) rnaSirenToFind = { siren: id.value };
        else throw new Error("Identifier not supported");

        dbos = await this.collection.find(rnaSirenToFind).toArray();

        if (!dbos.length) return null;

        return dbos.map(dbo => RnaSirenAdapter.toEntity(dbo));
    }
}

const rnaSirenPort = new RnaSirenPort();

export default rnaSirenPort;

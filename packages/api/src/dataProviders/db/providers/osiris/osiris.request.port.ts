import { FindOneAndUpdateOptions, ObjectId } from "mongodb";
import OsirisRequestEntity from "../../../../modules/providers/osiris/entities/OsirisRequestEntity";
import MongoPort from "../../../../shared/MongoPort";
import Siret from "../../../../valueObjects/Siret";
import Rna from "../../../../valueObjects/Rna";
import Siren from "../../../../valueObjects/Siren";

export class OsirisRequestPort extends MongoPort<OsirisRequestEntity> {
    collectionName = "osiris-requests";

    async createIndexes() {
        await this.collection.createIndex({ "providerInformations.uniqueId": 1 }, { unique: true });
        await this.collection.createIndex({ "providerInformations.osirisId": 1 });
        await this.collection.createIndex({ "legalInformations.rna": 1 });
        await this.collection.createIndex({ "legalInformations.siret": 1 });
    }

    public async add(osirisRequest: OsirisRequestEntity) {
        return this.collection.insertOne(osirisRequest);
    }

    /*
     * @deprecated
     * */
    public async update(osirisRequest: OsirisRequestEntity) {
        const options = { returnDocument: "after", includeResultMetadata: true } as FindOneAndUpdateOptions;
        const { _id, ...requestWithoutId } = osirisRequest;
        const updateRes = await this.collection.findOneAndUpdate(
            { "providerInformations.uniqueId": osirisRequest.providerInformations.uniqueId },
            { $set: requestWithoutId },
            options,
        );
        //@ts-expect-error -- mongo typing expects no metadata
        return updateRes?.value as OsirisRequestEntity;
    }

    public upsertOne(osirisRequest: OsirisRequestEntity) {
        const options = { upsert: true } as FindOneAndUpdateOptions;
        const { _id, ...requestWithoutId } = osirisRequest;
        return this.collection.updateOne(
            { "providerInformations.uniqueId": osirisRequest.providerInformations.uniqueId },
            { $set: requestWithoutId },
            options,
        );
    }

    public async findByMongoId(id: string): Promise<OsirisRequestEntity | null> {
        return this.collection.findOne({ _id: new ObjectId(id) });
    }

    public findByUniqueId(uniqueId: string) {
        return this.collection.findOne({
            "providerInformations.uniqueId": uniqueId,
        }) as unknown as Promise<OsirisRequestEntity | null>;
    }

    public findBySiret(siret: Siret) {
        return this.collection
            .find({
                "legalInformations.siret": siret.value,
            })
            .toArray();
    }

    public findByRna(rna: Rna) {
        return this.collection
            .find({
                "legalInformations.rna": rna.value,
            })
            .toArray();
    }

    public async findBySiren(siren: Siren) {
        return this.collection
            .find({
                "legalInformations.siret": new RegExp(`^${siren.value}\\d{5}`),
            })
            .toArray();
    }

    public cursorFindRequests(query = {}) {
        return this.collection.find(query);
    }
}

const osirisRequestPort: OsirisRequestPort = new OsirisRequestPort();
export default osirisRequestPort;

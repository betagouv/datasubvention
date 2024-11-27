import { AnyBulkWriteOperation } from "mongodb";
import MongoRepository from "../../../shared/MongoRepository";
import PaymentFlatEntity from "../../../entities/PaymentFlatEntity";
import PaymentFlatDbo from "./PaymentFlatDbo";
import PaymentFlatAdapter from "./PaymentFlat.adapter";

export class PaymentFlatPort extends MongoRepository<PaymentFlatDbo> {
    collectionName = "payments-flat";

    public async createIndexes(): Promise<void> {
        await this.collection.createIndex({ siret: 1, dateOperation: 1 });
    }

    public insertOne(entity: PaymentFlatEntity) {
        return this.collection.insertOne(PaymentFlatAdapter.toDbo(entity));
    }

    public upsertOne(entity: PaymentFlatEntity) {
        const updateDbo = PaymentFlatAdapter.toDbo(entity);
        this.collection.updateOne({ uniqueId: updateDbo.uniqueId }, { $set: updateDbo }, { upsert: true });
        return Promise.resolve();
    }

    // used in test
    public async findAll() {
        return (await this.collection.find({})).toArray();
    }

    public async deleteAll() {
        await this.collection.deleteMany({});
    }

    public async findAll() {
        return this.collection.find().toArray();
    }

    public async findAllUniqueSiren() {
        const result = await this.collection
            .aggregate([
                {
                    $group: {
                        _id: "$siren",
                    },
                },
                {
                    $project: {
                        _id: 0,
                        siren: "$_id",
                    },
                },
            ])
            .toArray();

        return result.map(doc => doc.siren);
    }
}

const paymentFlatPort = new PaymentFlatPort();
export default paymentFlatPort;

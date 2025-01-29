import MongoPort from "../../../shared/MongoPort";
import PaymentFlatEntity from "../../../entities/PaymentFlatEntity";
import { DefaultObject } from "../../../@types";
import PaymentFlatDbo from "./PaymentFlatDbo";
import PaymentFlatAdapter from "./PaymentFlat.adapter";

export class PaymentFlatPort extends MongoPort<PaymentFlatDbo> {
    collectionName = "payments-flat";

    public async createIndexes(): Promise<void> {
        await this.collection.createIndex({ siret: 1 });
        await this.collection.createIndex({ dateOperation: 1 });
        await this.collection.createIndex({ uniqueId: 1 }, { unique: true });
    }

    public async hasBeenInitialized() {
        const dbo = await this.collection.findOne({});
        return !!dbo;
    }

    public insertOne(entity: PaymentFlatEntity) {
        return this.collection.insertOne(PaymentFlatAdapter.toDbo(entity));
    }

    public upsertOne(entity: PaymentFlatEntity) {
        const updateDbo = PaymentFlatAdapter.toDbo(entity);
        const { _id, ...DboWithoutId } = updateDbo;
        return this.collection.updateOne({ uniqueId: updateDbo.uniqueId }, { $set: DboWithoutId }, { upsert: true });
    }

    public upsertMany(bulk) {
        return this.collection.bulkWrite(bulk, { ordered: false });
    }

    public insertMany(entities: PaymentFlatEntity[]) {
        return this.collection.insertMany(entities.map(entity => PaymentFlatAdapter.toDbo(entity), { ordered: false }));
    }

    // used in test
    public async findAll() {
        return (await this.collection.find({})).toArray();
    }

    public cursorFind(query: DefaultObject<unknown> = {}, projection: DefaultObject<unknown> = {}) {
        return this.collection.find(query, projection).map(PaymentFlatAdapter.dboToEntity);
    }

    public cursorFindChorusOnly(exerciceBudgetaire?: number) {
        if (!exerciceBudgetaire) {
            return this.cursorFind({ provider: "chorus" });
        } else return this.cursorFind({ provider: "chorus", exerciceBudgetaire: exerciceBudgetaire });
    }

    public async deleteAll() {
        await this.collection.deleteMany({});
    }
}

const paymentFlatPort = new PaymentFlatPort();
export default paymentFlatPort;

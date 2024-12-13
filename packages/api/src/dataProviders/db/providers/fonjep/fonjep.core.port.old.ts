import { Document } from "mongodb";
import MongoPort from "../../../../shared/MongoPort";

export abstract class FonjepCorePort<FonjepTypedDocument extends Document> extends MongoPort<FonjepTypedDocument> {
    private tmpCollectionEnabled = false;

    async createIndexes() {
        await this.collection.createIndex({ "legalInformations.siret": 1 });
    }

    useTemporyCollection(active) {
        this.tmpCollectionEnabled = active;
    }

    async applyTemporyCollection() {
        this.useTemporyCollection(false);
        await this.collection.rename(this.collectionName + "-OLD");
        await this.getTmpCollection().rename(this.collectionName);
        await this.createIndexes();
        await this.getOldCollection().drop();
    }

    protected get collection() {
        if (this.tmpCollectionEnabled) {
            return this.getTmpCollection();
        }

        return super.collection;
    }

    private getTmpCollection() {
        return this.db.collection<FonjepTypedDocument>(this.collectionName + "-tmp-collection");
    }

    private getOldCollection() {
        return this.db.collection<FonjepTypedDocument>(this.collectionName + "-OLD");
    }
}

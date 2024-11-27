import MongoRepository from "../../../shared/MongoRepository";
import SireneDbo from "./sireneDbo";

export class SirenePort extends MongoRepository<SireneDbo> {
    collectionName = "sirene";

    public async createIndexes(): Promise<void> {
        await this.collection.createIndex({ siren: 1 }, { unique: true });
    }

    public async insertMany(entities: SireneDbo[]) {
        return this.collection.insertMany(entities);
    }

    public async findAll() {
        return this.collection.find().toArray();
    }

    public async deleteAll() {
        await this.collection.deleteMany({});
    }
}

const sirenePort = new SirenePort();
export default sirenePort;

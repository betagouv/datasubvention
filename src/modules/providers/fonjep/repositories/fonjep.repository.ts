import { WithId } from "mongodb";
import { Siret } from "../../../../@types/Siret";
import db from "../../../../shared/MongoConnection";
import FonjepRequestEntity from "../entities/FonjepRequestEntity";

export class FonjepRepository {
    private readonly collection = db.collection<FonjepRequestEntity>("fonjep");

    async create(entity: FonjepRequestEntity) {
        const insertAction = await this.collection.insertOne(entity);
        return await this.collection.findOne({ _id: insertAction.insertedId }) as WithId<FonjepRequestEntity>;
    }

    async findBySiret(siret: Siret) {
        return this.collection.find({
            "legalInformations.siret": siret
        }).toArray();
    }
}

const fonjepRepository = new FonjepRepository();

export default fonjepRepository;
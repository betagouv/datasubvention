import { WithId } from "mongodb";
import { siretToSiren } from "../../../shared/helpers/SirenHelper";
import db from "../../../shared/MongoConnection";
import { isStartOfSiret } from "../../../shared/Validators";
import IAssociationName from "../@types/IAssociationName";
import AssociationNameEntity from "../entities/AssociationNameEntity";
import { Rna, Siren } from "@api-subventions-asso/dto";

export class AssociationNameRepository {
    private readonly collection = db.collection<AssociationNameEntity>("association-name");

    private toEntity(document: WithId<AssociationNameEntity> | IAssociationName) {
        return new AssociationNameEntity(
            document.rna,
            document.name,
            document.provider,
            document.lastUpdate,
            document.siren
        );
    }

    async findAllStartingWith(value: string) {
        if (isStartOfSiret(value)) value = siretToSiren(value); // Check if value is a start of siret
        return (
            await this.collection
                .find({
                    $or: [
                        { siren: { $regex: value, $options: "i" } },
                        {
                            rna: {
                                $regex: value,
                                $options: "i"
                            }
                        },
                        { name: { $regex: value, $options: "i" } }
                    ]
                })
                .toArray()
        ).map(document => this.toEntity(document));
    }

    async findOneByEntity(entity: AssociationNameEntity) {
        const result = await this.collection.findOne({ rna: entity.rna, siren: entity.siren, name: entity.name });
        if (result) return this.toEntity(result);
        return null;
    }

    findAllByIdentifier(identifier: Siren | Rna) {
        return this.collection.find({ $or: [{ rna: identifier }, { siren: identifier }] }).toArray();
    }

    async create(entity: AssociationNameEntity) {
        return this.collection.insertOne(Object.assign({}, entity)); // Clone entity to avoid mutating the entity;
    }

    async upsert(entity: AssociationNameEntity) {
        return this.collection.updateOne(
            {
                rna: entity.rna,
                siren: entity.siren,
                name: entity.name
            },
            {
                $setOnInsert: entity
            },
            { upsert: true }
        );
    }

    async insertMany(entities: AssociationNameEntity[]) {
        return this.collection.insertMany(entities, { ordered: false });
    }
}

const associationNameRepository = new AssociationNameRepository();

export default associationNameRepository;

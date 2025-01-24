import { DuplicateIndexError } from "../../shared/errors/dbError/DuplicateIndexError";
import rnaSirenPort from "../../dataProviders/db/rnaSiren/rnaSiren.port";
import apiAssoService from "../providers/apiAsso/apiAsso.service";
import RnaSirenEntity from "../../entities/RnaSirenEntity";
import Rna from "../../valueObjects/Rna";
import Siren from "../../valueObjects/Siren";
import AssociationIdentifier from "../../valueObjects/AssociationIdentifier";

export class RnaSirenService {
    async find(id: Rna | Siren): Promise<RnaSirenEntity[] | null> {
        const entities = await rnaSirenPort.find(id);

        if (entities) return entities;

        // If not rna siren matching search in API ASSO
        const { rna, siren } = await apiAssoService.findRnaSirenByIdentifiers(AssociationIdentifier.fromId(id));

        if (!rna || !siren) return null;
        const result = await this.insert(rna, siren);
        return result ? [result] : null;
    }

    async insert(rna: Rna, siren: Siren) {
        try {
            const entity = new RnaSirenEntity(rna, siren);
            await rnaSirenPort.insert(entity);
            return entity;
        } catch (e: unknown) {
            if (e instanceof DuplicateIndexError) return;
            throw e;
        }
    }

    async insertMany(duos: { rna: Rna; siren: Siren }[]) {
        const entities = duos.map(({ rna, siren }) => new RnaSirenEntity(rna, siren));

        try {
            return rnaSirenPort.insertMany(entities);
        } catch (e: unknown) {
            if (e instanceof DuplicateIndexError) return;
            throw e;
        }
    }
}

const rnaSirenService = new RnaSirenService();

export default rnaSirenService;

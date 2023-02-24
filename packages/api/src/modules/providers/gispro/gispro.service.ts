import { DemandeSubvention, Rna, Siren, Siret } from "@api-subventions-asso/dto";
import { DefaultObject } from "../../../@types";
import { isSiret, isAssociationName } from "../../../shared/Validators";
import DemandesSubventionsProvider from "../../subventions/@types/DemandesSubventionsProvider";
import IProvider from "../../providers/@types/IProvider";
import { ProviderEnum } from "../../../@enums/ProviderEnum";
import GisproRequestAdapter from "./adapters/GisproRequestAdapter";
import gisproRepository from "./repositories/gispro.repository";
import GisproActionEntity from "./entities/GisproActionEntity";

export const VALID_REQUEST_ERROR_CODE = {
    INVALID_SIRET: 1,
    INVALID_NAME: 2
};

export class GisproService implements DemandesSubventionsProvider, IProvider {
    provider = {
        name: "GISPRO",
        type: ProviderEnum.raw,
        description:
            "Gispro est un système d'information permettant d'effectuer l'instruction et la mise en paiement des dossiers de subvention recevables transmis via Dauphin."
    };

    public validEntity(entity: GisproActionEntity) {
        if (!isSiret(entity.providerInformations.siret)) {
            return {
                success: false,
                message: `INVALID SIRET FOR ${entity.providerInformations.siret}`,
                data: entity.providerInformations,
                code: VALID_REQUEST_ERROR_CODE.INVALID_SIRET
            };
        }

        if (!isAssociationName(entity.providerInformations.tier)) {
            return {
                success: false,
                message: `INVALID NAME FOR ${entity.providerInformations.tier}`,
                data: entity.providerInformations,
                code: VALID_REQUEST_ERROR_CODE.INVALID_NAME
            };
        }

        return { success: true };
    }

    public async upsertMany(requests: GisproActionEntity[]) {
        return await gisproRepository.upsertMany(requests);
    }

    public async insertMany(requests: GisproActionEntity[]) {
        return await gisproRepository.insertMany(requests);
    }

    public async add(entity: GisproActionEntity): Promise<{ state: string; result: GisproActionEntity }> {
        const existingFile = await gisproRepository.findByActionCode(entity.providerInformations.codeAction);

        if (existingFile) {
            return {
                state: "updated",
                result: await gisproRepository.update(entity)
            };
        }
        await gisproRepository.add(entity);
        return {
            state: "created",
            result: entity
        };
    }

    public async findBySiret(siret: Siret) {
        const actions = await gisproRepository.findBySiret(siret);
        return actions;
    }

    public async findBySiren(siren: Siren) {
        const actions = await gisproRepository.findBySiren(siren);
        return actions;
    }

    private groupByRequestCode(entities: GisproActionEntity[]): GisproActionEntity[][] {
        const entitiesByCode = entities.reduce((acc, entity) => {
            if (!acc[entity.providerInformations.codeRequest]) acc[entity.providerInformations.codeRequest] = [];
            acc[entity.providerInformations.codeRequest].push(entity);
            return acc;
        }, {} as DefaultObject<GisproActionEntity[]>);

        return Object.values(entitiesByCode);
    }

    isDemandesSubventionsProvider = true;

    async getDemandeSubventionBySiret(siret: Siret): Promise<DemandeSubvention[] | null> {
        const actions = await this.findBySiret(siret);

        if (actions.length === 0) return null;

        const groupedActions = this.groupByRequestCode(actions);

        return groupedActions.map(group => GisproRequestAdapter.toDemandeSubvention(group));
    }

    async getDemandeSubventionBySiren(siren: Siren): Promise<DemandeSubvention[] | null> {
        const actions = await this.findBySiren(siren);

        if (actions.length === 0) return null;

        const groupedActions = this.groupByRequestCode(actions);

        return groupedActions.map(group => GisproRequestAdapter.toDemandeSubvention(group));
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getDemandeSubventionByRna(rna: Rna): Promise<DemandeSubvention[] | null> {
        return null;
    }
}

export default new GisproService();

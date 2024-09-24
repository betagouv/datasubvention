import lodash from "lodash";
import { DemandeSubvention, Siren, Siret } from "dto";
import DemandesSubventionsProvider from "../../subventions/@types/DemandesSubventionsProvider";
import { ProviderEnum } from "../../../@enums/ProviderEnum";
import { DEMARCHES_SIMPLIFIEES_TOKEN } from "../../../configurations/apis.conf";
import { asyncForEach } from "../../../shared/helpers/ArrayHelper";
import { DefaultObject } from "../../../@types";
import { RawApplication, RawGrant } from "../../grant/@types/rawGrant";
import { InternalServerError } from "../../../shared/errors/httpErrors";
import ProviderCore from "../ProviderCore";
import GetDossiersByDemarcheId from "./queries/GetDossiersByDemarcheId";
import { DemarchesSimplifieesDto } from "./dto/DemarchesSimplifieesDto";
import DemarchesSimplifieesDtoAdapter from "./adapters/DemarchesSimplifieesDtoAdapter";
import demarchesSimplifieesDataRepository from "./repositories/demarchesSimplifieesData.repository";
import demarchesSimplifieesMapperRepository from "./repositories/demarchesSimplifieesMapper.repository";
import DemarchesSimplifieesMapperEntity from "./entities/DemarchesSimplifieesMapperEntity";
import { DemarchesSimplifieesEntityAdapter } from "./adapters/DemarchesSimplifieesEntityAdapter";
import { DemarchesSimplifieesRawData } from "./@types/DemarchesSimplifieesRawGrant";
import DemarchesSimplifieesDataEntity from "./entities/DemarchesSimplifieesDataEntity";

export class DemarchesSimplifieesService
    extends ProviderCore
    implements DemandesSubventionsProvider<DemarchesSimplifieesRawData>
{
    isDemandesSubventionsProvider = true;

    constructor() {
        super({
            name: "Démarches Simplifiées",
            type: ProviderEnum.api,
            description: "", // TODO
            id: "demarchesSimplifiees",
        });
    }

    private async getSchemasByIds() {
        const schemas = await demarchesSimplifieesMapperRepository.findAll();

        return schemas.reduce((acc, schema) => {
            acc[schema.demarcheId] = schema;
            return acc;
        }, {} as Record<string, DemarchesSimplifieesMapperEntity>);
    }

    private isDraft(entity: DemarchesSimplifieesDataEntity) {
        return entity && entity?.demande?.state === "en_construction";
    }

    private async filterAndAdaptEntities<T>(
        entities: DemarchesSimplifieesDataEntity[],
        adapter: (entity: DemarchesSimplifieesDataEntity, mapper: DemarchesSimplifieesMapperEntity) => T,
    ) {
        // TODO: I think we use schema and mapper to talk about the same thing here and we choose only one term
        const schemasByIds = await this.getSchemasByIds();
        const reduceToValidEntities = (acc, entity) => {
            const schema = schemasByIds[entity.demarcheId];
            if (!schema || this.isDraft(entity)) return acc;
            acc.push(adapter(entity, schema));
            return acc;
        };
        return entities.reduce(reduceToValidEntities, []) as T[];
    }

    private async entitiesToSubventions(entities: DemarchesSimplifieesDataEntity[]) {
        return await this.filterAndAdaptEntities<DemandeSubvention>(
            entities,
            DemarchesSimplifieesEntityAdapter.toSubvention,
        );
    }

    async getDemandeSubventionBySiren(siren: Siren): Promise<DemandeSubvention[] | null> {
        const demandes = await demarchesSimplifieesDataRepository.findBySiren(siren);
        return this.entitiesToSubventions(demandes);
    }

    async getDemandeSubventionBySiret(siret: Siret): Promise<DemandeSubvention[] | null> {
        const demandes = await demarchesSimplifieesDataRepository.findBySiret(siret);
        return this.entitiesToSubventions(demandes);
    }

    /**
     * |-------------------------|
     * |   Cache Maintenance     |
     * |-------------------------|
     */

    async updateAllForms() {
        const formsIds = await demarchesSimplifieesMapperRepository.getAcceptedDemarcheIds();

        if (!formsIds) {
            throw new Error("DS is not configured on this env, please add mapper");
        }

        await asyncForEach(formsIds, async formId => {
            await this.updateDataByFormId(formId);
        });
    }

    async updateDataByFormId(formId: number) {
        let result: DemarchesSimplifieesDto;
        let nextCursor: string | undefined = undefined;
        demarchesSimplifieesDataRepository.initBulk();
        do {
            result = await this.sendQuery(GetDossiersByDemarcheId, {
                demarcheNumber: formId,
                after: nextCursor,
            });

            if (result?.errors?.length)
                throw new InternalServerError(result?.errors?.map(error => error.message).join(" - "));
            if (!result?.data?.demarche)
                throw new InternalServerError("empty Démarches Simplifiées result (not normal with graphQL)");

            const entities = DemarchesSimplifieesDtoAdapter.toEntities(result, formId);
            for (const entity of entities) {
                demarchesSimplifieesDataRepository.stackUpsert(entity);
            }
            nextCursor = result?.data?.demarche?.dossiers?.pageInfo?.endCursor;
        } while (result?.data?.demarche?.dossiers?.pageInfo?.hasNextPage);
        await demarchesSimplifieesDataRepository.executeBulk();
    }

    async sendQuery(query: string, vars: DefaultObject) {
        if (!DEMARCHES_SIMPLIFIEES_TOKEN) throw new InternalServerError("DEMARCHES_SIMPLIFIEES_TOKEN is not defined");
        try {
            const result = await this.http.post<DemarchesSimplifieesDto>(
                "https://www.demarches-simplifiees.fr/api/v2/graphql",
                {
                    query,
                    variables: vars,
                },
                {
                    ...this.buildSearchHeader(DEMARCHES_SIMPLIFIEES_TOKEN),
                    keepAlive: true,
                },
            );

            return result.data;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    private buildSearchHeader(token: string) {
        return {
            headers: {
                accept: "application/json, text/plain, */*",
                "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
                authorization: "Bearer " + token,
                "content-type": "application/json;charset=UTF-8",
                "Referrer-Policy": "strict-origin-when-cross-origin",
            },
        };
    }

    addSchemaMapper(schema: DemarchesSimplifieesMapperEntity) {
        return demarchesSimplifieesMapperRepository.upsert(schema);
    }

    /**
     * |-------------------------|
     * |       Grant Part        |
     * |-------------------------|
     */

    isGrantProvider = true;

    /** GRANT */

    public getJoinKey(data: DemarchesSimplifieesRawData) {
        // TODO: rename schema to schemas and sub schema to default ?
        const schema = data.schema.schema;
        // EJ and versementKey are the same.
        // versementKey abstracts the EJ key that is not always the name of the joiner to match with payments
        // i.e: in Fonjep we use code_poste instead of EJ
        const joinKeyFieldName = schema.find(field => field.to === "ej" || field.to === "versementKey")?.from;

        let joinKey: string | undefined;
        if (joinKeyFieldName) joinKey = lodash.get(data.entity, joinKeyFieldName);
        return joinKey;
    }

    /** RAW GRANT */

    private async toRawGrants(providerGrants: DemarchesSimplifieesDataEntity[]) {
        // améliorer l'adapter pour voir l'ej en joinKey
        return await this.filterAndAdaptEntities<RawGrant>(
            providerGrants,
            DemarchesSimplifieesEntityAdapter.toRawGrant,
        );
    }

    async getRawGrantsBySiret(siret: string): Promise<RawGrant[]> {
        const grants = await demarchesSimplifieesDataRepository.findBySiret(siret);
        return await this.toRawGrants(grants);
    }

    async getRawGrantsBySiren(siren: string): Promise<RawGrant[]> {
        const grants = await demarchesSimplifieesDataRepository.findBySiren(siren);
        return await this.toRawGrants(grants);
    }

    rawToApplication(rawApplication: RawApplication<DemarchesSimplifieesRawData>) {
        return DemarchesSimplifieesEntityAdapter.rawToApplication(rawApplication);
    }

    rawToCommon(raw: RawGrant) {
        return DemarchesSimplifieesEntityAdapter.toCommon(raw.data.grant, raw.data.schema);
    }
}

const demarchesSimplifieesService = new DemarchesSimplifieesService();

export default demarchesSimplifieesService;

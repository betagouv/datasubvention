import * as Sentry from "@sentry/node";
import { CommonGrantDto, Rna, Siret } from "dto";
import { AssociationIdentifiers, StructureIdentifiers } from "../../@types";
import { StructureIdentifiersEnum } from "../../@enums/StructureIdentifiersEnum";
import providers from "../providers";
import { getIdentifierType } from "../../shared/helpers/IdentifierHelper";
import StructureIdentifiersError from "../../shared/errors/StructureIdentifierError";
import { isSiret } from "../../shared/Validators";
import AssociationIdentifierError from "../../shared/errors/AssociationIdentifierError";
import associationsService from "../associations/associations.service";
import rnaSirenService from "../rna-siren/rnaSiren.service";
import { siretToSiren } from "../../shared/helpers/SirenHelper";
import { BadRequestError } from "../../shared/errors/httpErrors";
import { RnaOnlyError } from "../../shared/errors/GrantError";
import { RawGrant, JoinedRawGrant } from "./@types/rawGrant";
import GrantProvider from "./@types/GrantProvider";
import commonGrantService from "./commonGrant.service";

export class GrantService {
    static getRawMethodNameByIdType = {
        [StructureIdentifiersEnum.siret]: "getRawGrantsBySiret",
        [StructureIdentifiersEnum.siren]: "getRawGrantsBySiren",
        [StructureIdentifiersEnum.rna]: "getRawGrantsByRna",
    };

    static getDefaultMethodNameByIdType = {
        [StructureIdentifiersEnum.siret]: "getGrantsBySiret",
        [StructureIdentifiersEnum.siren]: "getGrantsBySiren",
        [StructureIdentifiersEnum.rna]: "getGrantsByRna",
    };

    private validateAndGetStructureType(id: StructureIdentifiers) {
        const idType = getIdentifierType(id);
        if (!idType) throw new StructureIdentifiersError();
        return idType;
    }

    private async validateIsAssociation(id: StructureIdentifiers) {
        const siren = await associationsService.isSirenFromAsso(siretToSiren(id));
        if (!siren) throw new BadRequestError("identifier does not represent an association");
    }

    private async validateAndGetIdentifierInfo(identifier: StructureIdentifiers) {
        let type = this.validateAndGetStructureType(identifier);

        if (type === StructureIdentifiersEnum.rna) {
            const sirenValues = await this.getSirenValues(identifier);
            if (sirenValues) {
                type = sirenValues.type;
                identifier = sirenValues.identifier;
            } else {
                throw new RnaOnlyError(identifier);
            }
        } else {
            this.validateIsAssociation(identifier);
        }
        return { identifier, type };
    }

    private async getSirenValues(rna: Rna) {
        const rnaSirenEntities = await rnaSirenService.find(rna);
        if (rnaSirenEntities && rnaSirenEntities.length) {
            return { identifier: rnaSirenEntities[0].siren, type: StructureIdentifiersEnum.siren };
        }
        return null;
    }

    // appeler adapter pour chaque joine.application joine.payment et joine.fullGrant
    // implementer une classe GrantAdapter pour chaque adapter de demande et de paiment
    async getGrants(identifier: StructureIdentifiers) {
        const joinedRawGrants = await this.getRawGrants(identifier);
        // parcours chaque joinedRawGrant
        // joinedRawGrants.map(joined => {
        //     // si application ET fullGrants, alors on prend fullGrants
        //     if (joined.applications?.length && joined.fullGrants?.length) {
        //         Sentry.captureMessage(
        //             `A JoinedRawGrant had both applications AND fullGrants with joinKey ${joined.fullGrants[0].joinKey}`,
        //         );
        //     }
        //     if (!joined.payments?.length) {
        //         joined.fullGrants
        //     }
        //     if (joined.fullGrants?.length) {

        //     }
        // });
        // TODO: adapte to DemandeSubventionDto
        return joinedRawGrants;
    }

    /**
     * Fetch grants by SIREN or SIRET.
     * Grants can only be referenced by SIRET.
     *
     * If we got an RNA as identifier, we try to get the associated SIREN.
     * If we find it, we proceed the operation using it.
     * If not, we stop and return an empty array.
     *
     * @param identifier Rna, Siren or Siret
     * @returns List of grants (application with paiments)
     */
    async getRawGrants(identifier: StructureIdentifiers): Promise<JoinedRawGrant[]> {
        try {
            const { identifier: sirenOrSiret, type } = await this.validateAndGetIdentifierInfo(identifier);
            const method = GrantService.getRawMethodNameByIdType[type];
            const providers = this.getGrantProviders();
            const rawGrants = [
                ...(
                    await Promise.all(
                        providers.map(p => p[method](sirenOrSiret).then(g => (g || []) as RawGrant[]) || []),
                    )
                ).flat(),
            ];
            return this.joinGrants(rawGrants);
        } catch (e) {
            // IMPROVE: returning empty array does not inform the user that we could not search for grants
            // it does not mean that the association does not received any grants
            if (e instanceof RnaOnlyError) return [] as JoinedRawGrant[];
            else throw e;
        }
    }

    async getRawGrantsByAssociation(id: AssociationIdentifiers): Promise<JoinedRawGrant[]> {
        if (isSiret(id)) throw new AssociationIdentifierError();
        return this.getRawGrants(id);
    }

    async getRawGrantsByEstablishment(siret: Siret): Promise<JoinedRawGrant[]> {
        if (!isSiret(siret)) throw new StructureIdentifiersError("SIRET expected");
        return this.getRawGrants(siret);
    }

    private getGrantProviders(): GrantProvider[] {
        return Object.values(providers).filter(
            p => (p as unknown as GrantProvider).isGrantProvider,
        ) as unknown as GrantProvider[];
    }

    // on se dit que fullgrant n'a pas de payments => message Sentry
    // et on a des application avec des payments
    // pas de doublon application ou fullGrants => message
    private joinGrants(rawGrants: RawGrant[]): JoinedRawGrant[] {
        // TODO maybe think about a more sophisticated system than joinKey to group grants
        //  (specifically for dauphin/osiris joins with fonjep)
        const newJoiningGrant = () => ({ payments: [], applications: [], fullGrants: [] } as JoinedRawGrant);
        const lonelyGrants: JoinedRawGrant[] = [];
        const byKey: Record<string, JoinedRawGrant> = {};

        // organize results
        for (const rawGrant of rawGrants) {
            if (!rawGrant.joinKey) {
                lonelyGrants.push({ [`${rawGrant.type}s`]: [rawGrant] });
                continue;
            }
            if (!(rawGrant.joinKey in byKey)) byKey[rawGrant.joinKey] = newJoiningGrant();
            byKey[rawGrant.joinKey][`${rawGrant.type}s`]?.push(rawGrant);
        }

        // reunite joined, full and lonely grants
        return [...Object.values(byKey), ...lonelyGrants];
    }

    async getCommonGrants(id: StructureIdentifiers, publishable = false): Promise<CommonGrantDto[]> {
        const raws = await this.getRawGrants(id);

        return raws
            .map(raw => commonGrantService.rawToCommon(raw, publishable))
            .filter(adapted => !!adapted) as CommonGrantDto[];
    }
}

const grantService = new GrantService();

export default grantService;

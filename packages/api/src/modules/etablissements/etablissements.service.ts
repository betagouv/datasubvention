import { Siren, Siret } from "@api-subventions-asso/dto";

import LeCompteAssoRequestAdapter from "../providers/leCompteAsso/adapters/LeCompteAssoRequestAdapter";
import EtablissementDtoAdapter from "../providers/dataEntreprise/adapters/EtablisementDtoAdapter";
import OsirisRequestAdapter from "../providers/osiris/adapters/OsirisRequestAdapter";
import EtablissementProvider from "./interfaces/EtablissementProvider";
import FormaterHelper from "../../shared/helpers/FormaterHelper";
import Etablissement from "./interfaces/Etablissement";
import providers from "../providers";

import { ProviderValues, DefaultObject } from "../../@types";
import FonjepEntityAdapter from "../providers/fonjep/adapters/FonjepEntityAdapter";

export class EtablissementsService {
    
    private provider_score: DefaultObject<number> = {
        [EtablissementDtoAdapter.PROVIDER_NAME]: 1,
        [OsirisRequestAdapter.PROVIDER_NAME]: 0.5,
        [LeCompteAssoRequestAdapter.PROVIDER_NAME]: 0.5,
        [FonjepEntityAdapter.PROVIDER_NAME]: 0.5
    }

    async getEtablissement(siret: Siret) {
        const data = await (await this.aggregate(siret, "SIRET")).flat().filter(d => d) as Etablissement[];
        
        if (!data.length) return null;

        return FormaterHelper.formatData(data as DefaultObject<ProviderValues>[], this.provider_score) as Etablissement;
    }

    async getEtablissementsBySiren(siren: Siren) {
        const data = await (await this.aggregate(siren, "SIREN")).flat().filter(d => d) as Etablissement[];
        
        if (!data.length) return null;

        const groupBySiret = data.reduce((acc, etablisement) => {
            const siret = etablisement.siret[0].value;

            if (!siret) return acc;

            if (!acc[siret]) acc[siret] = [];
            acc[siret].push(etablisement);

            return acc;
        }, {} as DefaultObject<Etablissement[]>);

        return Object.values(groupBySiret).map(etablisements => FormaterHelper.formatData(etablisements as DefaultObject<ProviderValues>[], this.provider_score) as Etablissement)
    }


    private async aggregate(id: Siren | Siret, type: "SIRET" | "SIREN") {
        const etablisementProviders = this.getEtablissementProviders();
        
        return await etablisementProviders.reduce(async (acc, provider) => {
            const result = await acc;
            const etablissements = await (
                type === "SIREN"
                    ? provider.getEtablissementsBySiren(id, true)
                    : provider.getEtablissementsBySiret(id, true)
            );
            if (etablissements) {
                result.push(...etablissements.flat());
            }

            return acc;
        }, Promise.resolve([]) as Promise<Etablissement[]>);
    }

    private getEtablissementProviders() {
        return Object.values(providers).filter(this.isEtablissementProvider) as EtablissementProvider[];
    }

    private isEtablissementProvider(data: unknown): data is EtablissementProvider {
        return (data as EtablissementProvider).isEtablissementProvider;
    }
}

const etablissementService = new EtablissementsService();

export default etablissementService;
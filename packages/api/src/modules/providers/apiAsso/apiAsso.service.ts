import { Rna, Siren, Siret } from "@api-subventions-asso/dto";
import axios from "axios";
import { API_ASSO_URL } from "../../../configurations/apis.conf";
import CacheData from "../../../shared/Cache";
import EventManager from "../../../shared/EventManager";
import { siretToSiren } from "../../../shared/helpers/SirenHelper";
import Association from "../../associations/@types/Association";
import AssociationsProvider from "../../associations/@types/AssociationsProvider";
import Etablissement from "../../etablissements/@types/Etablissement";
import EtablissementProvider from "../../etablissements/@types/EtablissementProvider";
import ApiAssoDtoAdapter from "./adapters/ApiAssoDtoAdapter";
import StructureDto from "./dto/StructureDto";


const CACHE_TIME = 1000 * 60 * 60 * 24; // 1 day

export class ApiAssoService implements AssociationsProvider, EtablissementProvider {
    public providerName = "API ASSO";
    private dataSirenCache = new CacheData<{ associations: Association[], etablissements: Etablissement[]}>(CACHE_TIME);
    private dataRnaCache = new CacheData<{ associations: Association[], etablissements: Etablissement[]}>(CACHE_TIME);
    private requestCache = new CacheData<unknown>(CACHE_TIME);

    private async sendRequest<T>(route: string): Promise<T | null> {
        if (this.requestCache.has(route)) return this.requestCache.get(route)[0] as T;

        try {
            const res = await axios.get<T>(`${API_ASSO_URL}/${route}`, {
                headers: {
                    'Accept': "application/json"
                }
            });

            if (res.status === 200) {
                this.requestCache.add(route, res.data);
                return res.data;
            }
            return null;
        } catch {
            return null;
        }
    }

    private async getAssociationsAndEtablissementsBySiren(sirenOrRna: Siren | Rna): Promise<{associations: Association[], etablissements: Etablissement[]} | null> {
        if (this.dataSirenCache.has(sirenOrRna)) return this.dataSirenCache.get(sirenOrRna)[0];
        if (this.dataRnaCache.has(sirenOrRna)) return this.dataRnaCache.get(sirenOrRna)[0];

        let etablissements: Etablissement[] = [];

        const structure = await this.sendRequest<StructureDto>(`/structure/${sirenOrRna}`);

        if (!structure) return null;

        if (structure.identite.id_rna && structure.identite.id_siren) {
            EventManager.call('rna-siren.matching', [{ rna: structure.identite.id_rna, siren: structure.identite.id_siren}])
        }

        if (structure.etablissement) {
            etablissements = structure.etablissement.map(e => ApiAssoDtoAdapter.toEtablissement(e, structure.rib, structure.representant_legal, structure.identite.date_modif_siren));
        }

        const result =  {
            associations: ApiAssoDtoAdapter.toAssociation(structure),
            etablissements
        };

        if (structure.identite.id_siren) this.dataSirenCache.add(structure.identite.id_siren, result);
        if (structure.identite.id_rna) this.dataRnaCache.add(structure.identite.id_rna, result);

        return result;
    }

    /**
     * |-------------------------|
     * |    Associations Part    |
     * |-------------------------|
     */

    isAssociationsProvider = true

    async getAssociationsBySiren(siren: Siren): Promise<Association[] | null> {
        const result = await this.getAssociationsAndEtablissementsBySiren(siren);

        if (!result) return null;

        return result.associations;
    }

    async getAssociationsBySiret(siret: Siret): Promise<Association[] | null> {
        return this.getAssociationsBySiren(siretToSiren(siret));
    }
    
    async getAssociationsByRna(rna: Rna): Promise<Association[] | null> {
        const result = await this.getAssociationsAndEtablissementsBySiren(rna);

        if (!result) return null;

        return result.associations;
    }

    /**
     * |-------------------------|
     * |   Etablissement Part    |
     * |-------------------------|
     */
    
    isEtablissementProvider = true;

    async getEtablissementsBySiret(siret: Siret): Promise<Etablissement[] | null> {
        const siren = siretToSiren(siret);
    
        const result = await this.getEtablissementsBySiren(siren);

        if (!result) return null;

        return result.filter(e => e.siret[0].value === siret);
    }

    async getEtablissementsBySiren(siren: Siren): Promise<Etablissement[] | null> {
        const result = await this.getAssociationsAndEtablissementsBySiren(siren);

        if (!result) return null;

        return result.etablissements;
    }
}

const apiAssoService = new ApiAssoService();

export default apiAssoService;
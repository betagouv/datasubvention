import { Siren, Siret, Rna } from "@api-subventions-asso/dto";
import DemandeSubvention from "./DemandeSubvention";

export default interface DemandesSubventionsProvider {
    isDemandesSubventionsProvider: boolean,

    getDemandeSubventionBySiret(siret: Siret): Promise<DemandeSubvention[] | null>
    getDemandeSubventionBySiren(siren: Siren): Promise<DemandeSubvention[] | null>
    getDemandeSubventionByRna(rna: Rna): Promise<DemandeSubvention[] | null>
}
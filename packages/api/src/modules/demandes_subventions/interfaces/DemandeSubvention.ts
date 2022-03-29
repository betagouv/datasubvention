import { Siret } from "@api-subventions-asso/dto";
import { ProviderValue } from "../../../@types";
import Versement from "../../versements/interfaces/Versement";

export default interface DemandeSubvention {
    service_instructeur: ProviderValue<string>,
    siret: ProviderValue<Siret>,
    dispositif?: ProviderValue<string>,
    sous_dispositif?: ProviderValue<string>,
    ej?: ProviderValue<string>
    annee_demande?: ProviderValue<number>
    date_commision?: ProviderValue<Date>,
    financeur_principal?: ProviderValue<string>
    creer_le?: ProviderValue<Date>,
    transmis_le?: ProviderValue<Date>,
    pluriannualite?: ProviderValue<string>
    contact?:{
        email: ProviderValue<string>,
        telephone?: ProviderValue<string>,
    }
    status: ProviderValue<string>,
    montants?: {
        total?: ProviderValue<number>,
        demande?: ProviderValue<number>,
        propose?: ProviderValue<number>,
        accorde: ProviderValue<number>,
    },
    versement?: {
        acompte: ProviderValue<number>,
        solde: ProviderValue<number>,
        realise: ProviderValue<number>,
        compensation: {
            'n-1': ProviderValue<number>,
            reversement: ProviderValue<number>,
        }
    },
    actions_proposee?: {
        ej?: ProviderValue<string>
        rang: ProviderValue<number>,
        intitule: ProviderValue<string>,
        objectifs: ProviderValue<string>,
        objectifs_operationnels: ProviderValue<string>,
        description: ProviderValue<string>,
        nature_aide: ProviderValue<string>,
        modalite_aide: ProviderValue<string>,
        modalite_ou_dispositif: ProviderValue<string>,
        indicateurs: ProviderValue<string>,
        cofinanceurs: {
            noms: ProviderValue<string>,
            montant_demandes: ProviderValue<number>,
        },
        montants_versement: {
            total: ProviderValue<number>,
            demande: ProviderValue<number>,
            propose: ProviderValue<number>,
            accorde: ProviderValue<number>,
            attribue: ProviderValue<number>,
            realise: ProviderValue<number>,
            compensation: ProviderValue<number>,
        },
    }[]
    territoires?: {
        status: ProviderValue<string>
        commentaire: ProviderValue<string>
    }[]

    versements?: Versement[],
    evaluation?: {
        evaluation_resultat: ProviderValue<string>,
        cout_total_realise: ProviderValue<number>
    }
}
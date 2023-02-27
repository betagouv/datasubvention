import { Siret } from "@api-subventions-asso/dto";

export default interface CaisseDepotsSubvDto {
    id: string;
    timestamp: string;
    fields: {
        montant: number;
        notificationue: "Oui" | "Non";
        objet: string;
        datesversement_debut: string;
        datesversement_fin: string | null;
        dateconvention: string;
        nonbeneficiaire: string;
        nature: string;
        nomattribuant: string;
        idbeneficiare: Siret;
        pourcentagesubvention: number;
        conditionsversement: string;
        idattribuant: Siret;
        referencedecision: string | null;
    };
}

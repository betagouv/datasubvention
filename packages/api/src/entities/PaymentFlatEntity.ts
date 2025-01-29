import * as Sentry from "@sentry/node";
import {
    idEntrepriseType,
    idEtablissementType,
    typeIdEntreprise,
    typeIdEtablissement,
} from "../valueObjects/typeIdentifier";
import { ParserInfo } from "../@types";
import { GenericParser } from "../shared/GenericParser";
import Siret from "../valueObjects/Siret";

export default class PaymentFlatEntity {
    private static regionMapping: Record<string, string> = {
        ADCE: "Administration Centrale",
        DEFE: "Administration Centrale",
        DILA: "Administration Centrale",
        ETR1: "Administration Centrale",

        DOM1: "DOM-TOM",
        DOM2: "DOM-TOM",
        DOM3: "DOM-TOM",
        DOM4: "DOM-TOM",

        ALSA: "Grand Est",
        LORR: "Grand Est",
        CHAR: "Grand Est",

        AQUI: "Nouvelle-Aquitaine",
        LIMO: "Nouvelle-Aquitaine",
        POIT: "Nouvelle-Aquitaine",

        AUVE: "Auvergne-Rhône-Alpes",
        RALP: "Auvergne-Rhône-Alpes",

        BNOR: "Normandie",
        HNOR: "Normandie",

        BOUR: "Bourgogne-Franche-Comté",
        FRCO: "Bourgogne-Franche-Comté",

        BRET: "Bretagne",

        CENT: "Centre-Val de Loire",

        CORS: "Corse",

        IDF1: "Île-de-France",

        LANG: "Occitanie",
        MIPY: "Occitanie",

        NORP: "Hauts-de-France",
        PICA: "Hauts-de-France",

        PACA: "Provence-Alpes-Côte d'Azur",

        PAYL: "Pays de la Loire",
    };

    public static getRegionAttachementComptable(attachementComptable: string | "N/A"): string | "N/A" {
        if (attachementComptable == "N/A") return "N/A";

        const region = PaymentFlatEntity.regionMapping[attachementComptable];
        if (region === undefined) {
            const errorMessage = `Unknown region code: ${attachementComptable}`;
            Sentry.captureException(new Error(errorMessage));
            console.error(errorMessage);
            return "code region inconnu";
        }
        return region;
    }

    public static chorusToPaymentFlatPath: { [key: string]: ParserInfo } = {
        exerciceBudgetaire: {
            path: ["Exercice comptable"],
            adapter: value => {
                if (!value) return value;
                return parseInt(value, 10);
            },
        },
        typeIdEtablissementBeneficiaire: {
            path: ["Code taxe 1"],
            adapter: value => {
                if (Siret.isSiret(value)) return "siret";
            },
        },
        idEtablissementBeneficiaire: {
            path: ["Code taxe 1"],
            adapter: value => {
                if (value) return new Siret(value);
            },
        },
        typeIdEntrepriseBeneficiaire: {
            path: ["Code taxe 1"],
            adapter: value => {
                if (Siret.isSiret(value)) return "siren";
            },
        },
        idEntrepriseBeneficiaire: {
            path: ["Code taxe 1"],
            adapter: value => {
                if (value) return new Siret(value).toSiren();
            },
        },
        amount: {
            path: ["Montant payé"],
            adapter: value => {
                if (!value || typeof value === "number") return value;

                return parseFloat(value.replaceAll(/[\r ]/, "").replace(",", "."));
            },
        },
        dateOperation: {
            path: ["Date de dernière opération sur la DP"],
            adapter: value => {
                if (!value) return value;
                if (value != parseInt(value, 10).toString()) {
                    const [day, month, year] = value.split(/[/.]/).map(v => parseInt(v, 10));
                    return new Date(Date.UTC(year, month - 1, day));
                }
                return GenericParser.ExcelDateToJSDate(parseInt(value, 10));
            },
        },

        centreFinancierCode: {
            path: ["Centre financier CODE"],
        },
        centreFinancierLibelle: {
            path: ["Centre financier"],
        },
        attachementComptable: {
            path: ["Société"],
        },
        ej: {
            path: ["N° EJ"],
        },
        provider: {
            path: [],
            adapter: () => "chorus",
        },
    };

    public regionAttachementComptable: string | "N/A" | "code region inconnu";
    public idVersement: string;
    public uniqueId: string;

    constructor(
        public exerciceBudgetaire: number,
        public typeIdEtablissementBeneficiaire: typeIdEtablissement,
        public idEtablissementBeneficiaire: idEtablissementType<typeIdEtablissement>,
        public typeIdEntrepriseBeneficiaire: typeIdEntreprise,
        public idEntrepriseBeneficiaire: idEntrepriseType<typeIdEntreprise>,
        public amount: number,
        public operationDate: Date,
        public centreFinancierCode: string | "N/A",
        public centreFinancierLibelle: string | "N/A" | null,
        public attachementComptable: string | "N/A",
        public ej: string,
        public provider: string,
        public programName: string | null,
        public programNumber: number,
        public mission: string | null,
        public ministry: string | null,
        public ministryAcronym: string | null,
        public actionCode: string,
        public actionLabel: string | null,
        public activityCode: string | null,
        public activityLabel: string | null,
    ) {
        this.regionAttachementComptable = PaymentFlatEntity.getRegionAttachementComptable(attachementComptable);
        this.idVersement = `${idEtablissementBeneficiaire}-${ej}-${exerciceBudgetaire}`;
        this.uniqueId = `${
            this.idVersement
        }-${programNumber}-${actionCode}-${activityCode}-${operationDate.getTime()}-${attachementComptable}-${centreFinancierCode}`;
    }
}

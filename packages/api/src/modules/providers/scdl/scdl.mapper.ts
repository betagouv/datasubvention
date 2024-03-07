import { DefaultObject, ParserInfo, ParserPath } from "../../../@types";
import { shortISORegExp } from "../../../shared/helpers/DateHelper";

const OFFICIAL_MAPPER = {
    allocatorName: "nomAttribuant",
    allocatorSiret: "idAttribuant",
    conventionDate: "dateConvention",
    decisionReference: "referenceDecision",
    associationName: "nomBeneficiaire",
    associationSiret: "idBeneficiaire",
    associationRna: "rnaBeneficiaire",
    object: "object",
    amount: "montant",
    paymentNature: "nature",
    paymentConditions: "conditionsVersement",
    paymentStartDate: "datesPeriodeVersement",
    paymentEndDate: "datesPeriodeVersement",
    idRAE: "idRAE",
    UeNotification: "notificationUE",
    grantPercentage: "pourcentageSubvention",
    aidSystem: "dispositifAide",
};

function getMapperVariants(prop): string[] {
    const header = OFFICIAL_MAPPER[prop];
    return [header, header.toLowerCase(), header.toUpperCase()];
}

const expandedShortISOPeriodRegExp = /\d{4}-[01]\d-[0-3]\d[/_]\d{4}-[01]\d-[0-3]\d/;

// THIS IS A QUICK WIN
// TODO #2247 : refactor the process to make mapper customizable by producer
// Many times conventionDate is not used and another column is used to give the year of exercice
const OVERRIDE_CONVENTION_DATE = ["annee", "exercice", "dateDecision_Tri"];

export const SCDL_MAPPER: DefaultObject<ParserPath | ParserInfo> = {
    allocatorName: [[...getMapperVariants("allocatorName"), "Nom attributaire*", "Nom de l attribuant"]],
    allocatorSiret: [[...getMapperVariants("allocatorSiret"), "Identification de l'attributaire*"]],
    conventionDate: {
        path: [
            [
                ...OVERRIDE_CONVENTION_DATE,
                ...getMapperVariants("conventionDate"),
                "datedeconvention",
                "Date de convention*",
            ],
        ],
        adapter: value => (value ? new Date(value) : value),
    },
    decisionReference: [[...getMapperVariants("decisionReference"), "Référence de la décision"]],
    associationName: [[...getMapperVariants("associationName"), "Nom du bénéficiaire*"]],
    associationSiret: [[...getMapperVariants("associationSiret"), "Identification du bénéficiaire*"]],
    associationRna: [[...getMapperVariants("associationRna")]],
    object: [[...getMapperVariants("object"), "objet", "Objet de la convention"]],
    amount: {
        path: [[...getMapperVariants("amount"), "Montant total de la subvention*"]],
        adapter: value => (value ? parseFloat(value) : value),
    },
    paymentNature: [[...getMapperVariants("paymentNature")]],
    paymentConditions: [[...getMapperVariants("paymentConditions"), "Conditions de versement*"]],
    paymentStartDate: {
        path: [
            [
                ...getMapperVariants("paymentStartDate"),
                "Date de versement",
                "dateperiodedeversement",
                "dateperiodedversement",
            ],
        ],
        // @ts-expect-error: with undefined it returns false, so we don't need to check it
        adapter: value => (shortISORegExp.test(value) ? new Date(value.split(/[/_]/)[0].trim()) : value),
    },
    paymentEndDate: {
        path: [[...getMapperVariants("paymentEndDate"), "Date de versement", "dateperiodedversement"]],
        adapter: value => {
            const noSpaceValue = value?.replaceAll(" ", "");
            // @ts-expect-error: with undefined it returns false, so we don't need to check it
            if (expandedShortISOPeriodRegExp.test(noSpaceValue)) return new Date(noSpaceValue.split(/[/_]/)[1].trim());
            // @ts-expect-error: with undefined it returns false, so we don't need to check it
            else if (shortISORegExp.test(noSpaceValue)) return new Date(noSpaceValue);
            else return null;
        },
    },
    idRAE: [[...getMapperVariants("idRAE"), "Numéro de référencement au répertoire des entreprises"]],
    UeNotification: {
        path: [[...getMapperVariants("UeNotification"), "Aide notifiée Ã  l'Europe"]],
        adapter: value => {
            if (value?.toLowerCase() === "oui") return true;
            if (value?.toLowerCase() === "non") return false;
            return undefined;
        },
    },
    grantPercentage: {
        path: [
            [
                ...getMapperVariants("grantPercentage"),
                "Pourcentage du montant de la subvention attribué au bénéficiaire*",
            ],
        ],
        adapter: value => (value ? parseFloat(value) : value),
    },
    aidSystem: [[...getMapperVariants("aidSystem")]],
};

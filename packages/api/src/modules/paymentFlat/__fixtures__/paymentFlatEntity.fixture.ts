import { ChorusPayment } from "dto";
import DEFAULT_ASSOCIATION from "../../../../tests/__fixtures__/association.fixture";
import PaymentFlatEntity from "../../../entities/PaymentFlatEntity";
import Siren from "../../../valueObjects/Siren";
import Siret from "../../../valueObjects/Siret";
import { PAYMENT_FLAT_DBO } from "../../../dataProviders/db/paymentFlat/__fixtures__/paymentFlatDbo.fixture";

export const PAYMENT_FLAT_ENTITY = new PaymentFlatEntity(
    2023, // exerciceBudgetaire
    "siret", // typeIdEtablissementBeneficiaire
    new Siret(DEFAULT_ASSOCIATION.siret), // siret
    "siren", // typeIdEntrepriseBeneficiaire
    new Siren(DEFAULT_ASSOCIATION.siren), // siren
    89988.3, // operation amount
    new Date("2023-07-12T00:00:00.000Z"), // operation date
    "AA01/0776-C001-4000", // centre financier code
    "UO DGER XXXX-C001", // centre financier libelle
    "BRET", // attachement comptable
    "0001821732", // EJ
    "chorus", // provider
    "Programme Exemple", // program
    101, // program number
    "Mission Exemple", // mission
    "Ministère Exemple", // ministry
    "ME", // ministry acronym
    "0101-01-02", // action code
    "Label d'action Exemple", // action label
    "077601003222", // activity code
    "Label d'activité Exemple", // activity label
);

const buildProviderValue = value => ({
    value,
    provider: "paymentflat",
    type: typeof value,
    last_update: new Date("2025-02-04"),
});

export const PAYMENT_FROM_PAYMENT_FLAT_DBO: ChorusPayment = {
    ej: buildProviderValue(PAYMENT_FLAT_DBO.ej),
    versementKey: buildProviderValue(PAYMENT_FLAT_DBO.idVersement),
    siret: buildProviderValue(PAYMENT_FLAT_DBO.idEtablissementBeneficiaire),
    amount: buildProviderValue(PAYMENT_FLAT_DBO.montant),
    dateOperation: buildProviderValue(PAYMENT_FLAT_DBO.dateOperation),
    centreFinancier: buildProviderValue(PAYMENT_FLAT_DBO.libelleCentreFinancier),
    domaineFonctionnel: buildProviderValue(PAYMENT_FLAT_DBO.action),
    activitee: buildProviderValue(PAYMENT_FLAT_DBO.activite),
    programme: buildProviderValue(PAYMENT_FLAT_DBO.numeroProgramme),
    libelleProgramme: buildProviderValue(PAYMENT_FLAT_DBO.programme),
};

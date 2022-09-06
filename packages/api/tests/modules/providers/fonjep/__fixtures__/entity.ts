import FonjepEntity from '../../../../../src/modules/providers/fonjep/entities/FonjepRequestEntity';
import FonjepVersementEntity from "../../../../../src/modules/providers/fonjep/entities/FonjepVersementEntity";

export const SubventionEntity = new FonjepEntity(
    {
        siret: "00000000000002",
        name: "FONJET_ENTITY_FIXTURE"
    },
    {
        unique_id: "unique_id",
        montant_paye: 500,
        status: "En cours",
        plein_temps: "Oui",
        service_instructeur: "XXX",
        annee_demande: 2022,
        updated_at: new Date("2022-01-02"),
        date_fin_triennale: new Date("2022-01-03"),
        code_postal: "75000",
        ville: "Paris",
        contact: "contact@beta.gouv.fr",
        type_post: "POSTE",
        dispositif: "Dispositif"
    },
    {}
)

export const VersementEntity = new FonjepVersementEntity(
    {
        siret: "00000000000002"
    },
    {
        unique_id: "unique_id",
        updated_at: new Date(),
        periode_debut: new Date(),
        periode_fin: new Date(),
        date_versement: new Date(),
        montant_payer: "",
        montant_a_payer: ""
    },
    {}
)
import PaymentFlatEntity from "../../../entities/PaymentFlatEntity";
import AmountsVsProgrammeRegionEntity from "./entitiyAndDbo/amountsVsProgramRegion.entity";

export default class AmountsVsProgrammeRegionAdapter {
    static toNotAggregatedEntity(paymentFlatEntity: PaymentFlatEntity): AmountsVsProgrammeRegionEntity {
        const amountsVsProgrammeRegionEntity = {
            exerciceBudgetaire: paymentFlatEntity.exerciceBudgetaire,
            regionAttachementComptable: paymentFlatEntity.regionAttachementComptable
                ? paymentFlatEntity.regionAttachementComptable
                : "Non renseigné",
            programme: paymentFlatEntity.programName
                ? String(paymentFlatEntity.programNumber).concat(" - ", paymentFlatEntity.programName)
                : String(paymentFlatEntity.programNumber),
            mission: paymentFlatEntity.mission,
            montant: paymentFlatEntity.amount,
        };
        return amountsVsProgrammeRegionEntity;
    }
}

import { ObjectId } from "mongodb";
import PaymentFlatEntity from "../../../entities/PaymentFlatEntity";
import PaymentFlatDbo from "./PaymentFlatDbo";
import Siret from "../../../valueObjects/Siret";
import Siren from "../../../valueObjects/Siren";

export default class PaymentsFlatAdapter {
    static toDbo(entity: PaymentFlatEntity): PaymentFlatDbo {
        return {
            _id: new ObjectId(),
            typeIdEntrepriseBeneficiaire: entity.typeIdEntrepriseBeneficiaire,
            idEntrepriseBeneficiaire: entity.idEntrepriseBeneficiaire.value,
            typeIdEtablissementBeneficiaire: entity.typeIdEtablissementBeneficiaire,
            idEtablissementBeneficiaire: entity.idEtablissementBeneficiaire.value,
            uniqueId: entity.uniqueId,
            idVersement: entity.idVersement,
            exerciceBudgetaire: entity.exerciceBudgetaire,
            montant: entity.amount,
            dateOperation: entity.operationDate,
            programme: entity.programName,
            numeroProgramme: entity.programNumber,
            mission: entity.mission,
            ministere: entity.ministry,
            sigleMinistere: entity.ministryAcronym,
            ej: entity.ej,
            provider: entity.provider,
            codeAction: entity.actionCode,
            action: entity.actionLabel,
            codeActivite: entity.activityCode,
            activite: entity.activityLabel,
            codeCentreFinancier: entity.centreFinancierCode,
            libelleCentreFinancier: entity.centreFinancierLibelle,
            attachementComptable: entity.attachementComptable,
            regionAttachementComptable: entity.regionAttachementComptable,
        };
    }

    static dboToEntity(dbo: PaymentFlatDbo): PaymentFlatEntity {
        /* question: je suis obligé pour comment je crée l'entité de recalculer regionAttachement,
         idVersement and so on. C'est une bonne chose ?
         */
        return new PaymentFlatEntity(
            dbo.exerciceBudgetaire,
            dbo.typeIdEtablissementBeneficiaire,
            // to adapt when we will have typeId != siret
            new Siret(dbo.idEtablissementBeneficiaire),
            dbo.typeIdEntrepriseBeneficiaire,
            new Siren(dbo.idEntrepriseBeneficiaire),
            dbo.montant,
            dbo.dateOperation,
            dbo.codeCentreFinancier,
            dbo.libelleCentreFinancier,
            dbo.attachementComptable,
            dbo.ej,
            dbo.provider,
            dbo.programme,
            dbo.numeroProgramme,
            dbo.mission,
            dbo.ministere,
            dbo.sigleMinistere,
            dbo.codeAction,
            dbo.action,
            dbo.codeActivite,
            dbo.activite,
        );
    }
}

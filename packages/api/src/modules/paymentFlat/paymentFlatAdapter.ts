import { NestedDefaultObject } from "../../@types";
import DomaineFonctionnelEntity from "../../entities/DomaineFonctionnelEntity";
import MinistryEntity from "../../entities/MinistryEntity";
import PaymentFlatEntity from "../../entities/PaymentFlatEntity";
import RefProgrammationEntity from "../../entities/RefProgrammationEntity";
import StateBudgetProgramEntity from "../../entities/StateBudgetProgramEntity";
import { GenericParser } from "../../shared/GenericParser";

import { ChorusLineDto } from "../providers/chorus/adapters/chorusLineDto";
import ChorusLineEntity from "../providers/chorus/entities/ChorusLineEntity";

export default class PaymentFlatAdapter {
    static toNotAggregatedChorusPaymentFlatEntity(
        /*
        create a PaymentFlatEntity from a ChorusLineEntity without
        aggregating the data. To get "a real" PaymentFlat entity data have
        to be groupbed by the unique key of paymentFlat that is not necessarily
        the same as the unique key of the ChorusLineEntity.
        */

        chorusDocument: ChorusLineEntity,
        programs: Record<string, StateBudgetProgramEntity>,
        ministries: Record<string, MinistryEntity>,
        domainesFonct: Record<string, DomaineFonctionnelEntity>,
        refsProgrammation: Record<string, RefProgrammationEntity>,
    ): PaymentFlatEntity {
        const {
            programCode,
            activityCode,
            actionCode,
            programEntity,
            ministryEntity,
            domaineFonctEntity,
            refProgrammationEntity,
        } = this.getDataBretagneDocumentData(
            chorusDocument.data as ChorusLineDto,
            programs,
            ministries,
            domainesFonct,
            refsProgrammation,
        );

        const entityConstructorParameters = [
            ...Object.values(
                GenericParser.indexDataByPathObject(
                    PaymentFlatEntity.chorusToPaymentFlatPath,
                    chorusDocument.data as NestedDefaultObject<string>,
                ),
            ),
            programEntity?.label_programme ?? null, // programName,
            programCode, // programNumber,
            programEntity?.mission ?? null, // mission,
            ministryEntity?.nom_ministere ?? null, // ministry,
            ministryEntity?.sigle_ministere ?? null, // ministryAcronym,
            actionCode, // actionCode,
            domaineFonctEntity?.libelle_action ?? null, // actionLabel,
            activityCode ?? null, // activityCode,
            refProgrammationEntity?.libelle_activite ?? null, // activityLabel,
        ] as ConstructorParameters<typeof PaymentFlatEntity>;

        return new PaymentFlatEntity(...entityConstructorParameters);
    }

    private static getDataBretagneDocumentData(
        chorusDocument: ChorusLineDto,
        programs: Record<number, StateBudgetProgramEntity>,
        ministries: Record<string, MinistryEntity>,
        domainesFonct: Record<string, DomaineFonctionnelEntity>,
        refsProgrammation: Record<string, RefProgrammationEntity>,
    ) {
        const programCode = parseInt(chorusDocument["Domaine fonctionnel CODE"].slice(1, 4), 10);
        const activityCode = chorusDocument["Référentiel de programmation CODE"]?.slice(-12);
        const actionCode = chorusDocument["Domaine fonctionnel CODE"] ?? undefined;
        const programEntity = programs[String(programCode)] ?? undefined;

        if (!programEntity) {
            console.error(`Program not found for programCode: ${programCode}`);
        }
        const ministryEntity = programEntity ? ministries[programEntity.code_ministere] : undefined;
        if (!ministryEntity) {
            console.error(`Ministry not found for program: ${programCode}`);
        }
        const domaineFonctEntity = actionCode ? domainesFonct[actionCode] : undefined;
        if (!domaineFonctEntity) {
            console.error(`DomaineFonctionnel not found for actionCode: ${actionCode}`);
        }
        const refProgrammationEntity = activityCode ? refsProgrammation[activityCode] : undefined;
        if (!refProgrammationEntity) {
            console.error(`RefProgrammation not found for activityCode: ${activityCode}`);
        }

        return {
            programCode,
            activityCode,
            actionCode,
            programEntity,
            ministryEntity,
            domaineFonctEntity,
            refProgrammationEntity,
        };
    }
}

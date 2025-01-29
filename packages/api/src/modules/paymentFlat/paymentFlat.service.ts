import { FindCursor, WithId } from "mongodb";
import paymentFlatPort from "../../dataProviders/db/paymentFlat/paymentFlat.port";
import dataBretagneService from "../providers/dataBretagne/dataBretagne.service";
import chorusService from "../providers/chorus/chorus.service";
import PaymentFlatEntity from "../../entities/PaymentFlatEntity";
import ChorusLineEntity from "../providers/chorus/entities/ChorusLineEntity";
import PaymentFlatAdapterDbo from "../../dataProviders/db/paymentFlat/PaymentFlat.adapter";
import PaymentFlatAdapter from "./paymentFlatAdapter";

export class PaymentFlatService {
    private BATCH_SIZE = 50000;

    private async getAllDataBretagneData() {
        const ministries = await dataBretagneService.getMinistriesRecord();
        const programs = await dataBretagneService.findProgramsRecord();
        const domainesFonct = await dataBretagneService.getDomaineFonctRecord();
        const refsProgrammation = await dataBretagneService.getRefProgrammationRecord();

        return { programs, ministries, domainesFonct, refsProgrammation };
    }

    public isCollectionInitialized() {
        return paymentFlatPort.hasBeenInitialized();
    }

    public async toPaymentFlatChorusEntities(
        programs,
        ministries,
        domainesFonct,
        refsProgrammation,
        exerciceBudgetaire?: number,
    ) {
        /*
        from the chorus collection, create a list of PaymentFlatEntity 
        by aggregating NotAggregatedChorusPaymentFlatEntity having the same uniqueId
        */
        let chorusCursor: FindCursor<WithId<ChorusLineEntity>>;
        if (exerciceBudgetaire) {
            chorusCursor = chorusService.cursorFindDataWithoutHash(exerciceBudgetaire);
        } else {
            chorusCursor = chorusService.cursorFindDataWithoutHash();
        }
        const entities: Record<string, PaymentFlatEntity> = {};

        while (await chorusCursor.hasNext()) {
            const document = (await chorusCursor.next()) as ChorusLineEntity;

            const paymentFlatEntity = PaymentFlatAdapter.toNotAggregatedChorusPaymentFlatEntity(
                document,
                programs,
                ministries,
                domainesFonct,
                refsProgrammation,
            );

            if (entities[paymentFlatEntity.uniqueId]) {
                entities[paymentFlatEntity.uniqueId].amount = parseFloat(
                    (entities[paymentFlatEntity.uniqueId].amount + paymentFlatEntity.amount).toFixed(2),
                );
            } else {
                entities[paymentFlatEntity.uniqueId] = paymentFlatEntity;
            }
        }
        return Object.values(entities);
    }

    public async init() {
        const { programs, ministries, domainesFonct, refsProgrammation } = await this.getAllDataBretagneData();
        const chorusEntities: PaymentFlatEntity[] = await this.toPaymentFlatChorusEntities(
            programs,
            ministries,
            domainesFonct,
            refsProgrammation,
        );

        for (let i = 0; i < chorusEntities.length; i += this.BATCH_SIZE) {
            const batchEntities = chorusEntities.slice(i, i + this.BATCH_SIZE);
            await paymentFlatPort.insertMany(batchEntities);
            console.log(`Inserted ${i + this.BATCH_SIZE} documents`);
        }
    }

    public async updatePaymentsFlatCollection(exerciceBudgetaire?: number) {
        const { programs, ministries, domainesFonct, refsProgrammation } = await this.getAllDataBretagneData();

        const chorusEntities: PaymentFlatEntity[] = await this.toPaymentFlatChorusEntities(
            programs,
            ministries,
            domainesFonct,
            refsProgrammation,
            exerciceBudgetaire,
        );

        for (let i = 0; i < chorusEntities.length; i += this.BATCH_SIZE) {
            const batchEntities = chorusEntities.slice(i, i + this.BATCH_SIZE);

            const bulkWriteArray = batchEntities.map(entity => {
                const { _id, ...DboWithoutId } = PaymentFlatAdapterDbo.toDbo(entity);
                return {
                    updateOne: {
                        filter: { uniqueId: DboWithoutId.uniqueId },
                        update: { $set: DboWithoutId },
                        upsert: true,
                    },
                };
            });

            await paymentFlatPort.upsertMany(bulkWriteArray);
        }
        console.log("All documents inserted");
    }

    public cursorFindChorusOnly(exerciceBudgetaire?: number) {
        return paymentFlatPort.cursorFindChorusOnly(exerciceBudgetaire);
    }
}

const paymentFlatService = new PaymentFlatService();

export default paymentFlatService;

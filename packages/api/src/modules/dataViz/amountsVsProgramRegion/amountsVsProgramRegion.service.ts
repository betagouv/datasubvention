import { FindCursor } from "mongodb";
import PaymentFlatEntity from "../../../entities/PaymentFlatEntity";
import paymentFlatService from "../../paymentFlat/paymentFlat.service";
import amountsVsProgrammeRegionPort from "../../../dataProviders/db/dataViz/amountVSProgramRegion/amountsVsProgramRegion.port";
import AmountsVsProgrammeRegionAdapter from "./amountsVsProgramRegion.adapter";
import AmountsVsProgrammeRegionEntity from "./entitiyAndDbo/amountsVsProgramRegion.entity";

export class AmountsVsProgrammeRegionService {
    public async toAmountsVsProgrammeRegionEntities(
        exerciceBudgetaire?: number,
    ): Promise<AmountsVsProgrammeRegionEntity[]> {
        const paymentFlatCursor: FindCursor<PaymentFlatEntity> =
            paymentFlatService.cursorFindChorusOnly(exerciceBudgetaire);

        const entities: Record<string, AmountsVsProgrammeRegionEntity> = {};
        while (await paymentFlatCursor.hasNext()) {
            const document = (await paymentFlatCursor.next()) as PaymentFlatEntity;
            const key = `${document.regionAttachementComptable}-${document.programName}-${document.programNumber}`;
            if (entities[key]) {
                entities[key].montant += parseFloat(document.amount.toFixed(2));
            } else {
                entities[key] = { ...AmountsVsProgrammeRegionAdapter.toNotAggregatedEntity(document) };
            }
        }
        return Object.values(entities);
    }

    public async init() {
        const entities = await this.toAmountsVsProgrammeRegionEntities();
        await amountsVsProgrammeRegionPort.insertMany(entities);
    }

    public async updateCollection(exerciceBudgetaire?: number) {
        const entities = await this.toAmountsVsProgrammeRegionEntities(exerciceBudgetaire);
        await amountsVsProgrammeRegionPort.upsertMany(entities);
    }

    public isCollectionInitialized() {
        return amountsVsProgrammeRegionPort.hasBeenInitialized();
    }
}

const amountsVsProgrammeRegionService = new AmountsVsProgrammeRegionService();
export default amountsVsProgrammeRegionService;

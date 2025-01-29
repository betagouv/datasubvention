import { StaticImplements } from "../../decorators/staticImplements.decorator";
import { CliStaticInterface } from "../../@types";

import paymentsFlatService from "../../modules/paymentFlat/paymentFlat.service";
import CliController from "../../shared/CliController";

@StaticImplements<CliStaticInterface>()
export default class PaymentFlatCli extends CliController {
    static cmdName = "payment-flat";

    resyncExercice(exerciceBudgetaire: number) {
        if (!exerciceBudgetaire) throw new Error("Exercice budgetaire is required");

        this.logger.logIC(`Resync payment flat collection for exercice ${exerciceBudgetaire}`);
        return paymentsFlatService.updatePaymentsFlatCollection(exerciceBudgetaire);
    }

    // should only be used once, then sync with resyncExercise
    async init() {
        console.log("ciao");
        if (await paymentsFlatService.isCollectionInitialized())
            throw new Error("DB already initialized, used resyncExercice instead");

        this.logger.logIC("Create all payment flat collection");
        return paymentsFlatService.init();
    }
}

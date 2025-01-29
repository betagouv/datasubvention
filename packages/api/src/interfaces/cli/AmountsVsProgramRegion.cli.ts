import { CliStaticInterface } from "../../@types";
import { StaticImplements } from "../../decorators/staticImplements.decorator";
import amountsVsProgrammeRegionService from "../../modules/dataViz/amountsVsProgramRegion/amountsVsProgramRegion.service";
import CliController from "../../shared/CliController";

@StaticImplements<CliStaticInterface>()
export default class AmountsVsProgrammeRegionCli extends CliController {
    static cmdName = "amounts-vs-program-region";

    // should only be used once, then sync with resyncExercise
    async init() {
        if (await amountsVsProgrammeRegionService.isCollectionInitialized())
            throw new Error("DB already initialized, used resyncExercice instead");

        this.logger.logIC("Create all amounts vs programme region collection");
        return amountsVsProgrammeRegionService.init();
    }

    resyncExercice(exerciceBudgetaire: number) {
        this.logger.logIC(`Resync amounts vs programme region collection for exercice ${exerciceBudgetaire}`);
        return amountsVsProgrammeRegionService.updateCollection(exerciceBudgetaire);
    }
}

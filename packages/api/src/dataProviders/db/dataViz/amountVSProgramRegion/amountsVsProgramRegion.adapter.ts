import { ObjectId } from "mongodb";
import { AmountsVsProgrammeRegionDbo } from "../../../../modules/dataViz/amountsVsProgramRegion/entitiyAndDbo/amountsVsProgramRegion.dbo";
import AmountsVsProgrammeRegionEntity from "../../../../modules/dataViz/amountsVsProgramRegion/entitiyAndDbo/amountsVsProgramRegion.entity";

export default class AmountsVsProgrammeRegionAdapter {
    static toDbo(entity: AmountsVsProgrammeRegionEntity): AmountsVsProgrammeRegionDbo {
        return {
            _id: new ObjectId(),
            ...entity,
        };
    }
}

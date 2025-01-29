import { WithoutId } from "mongodb";
import { AmountsVsProgrammeRegionDbo } from "../../api/src/modules/dataViz/amountsVsProgramRegion/entitiyAndDbo/amountsVsProgramRegion.dbo";

export interface GetMontantVsProgrammeRegionSuccessResponse {
    montantVersusProgrammeRegion: WithoutId<AmountsVsProgrammeRegionDbo>;
}

export type GetMontantVsProgrammeRegionResponseDto = GetMontantVsProgrammeRegionSuccessResponse;

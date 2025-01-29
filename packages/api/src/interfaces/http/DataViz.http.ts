import { Controller, Get, Route, Security, Tags, Response } from "tsoa";
import { GetMontantVsProgrammeRegionResponseDto } from "dto";
import { HttpErrorInterface } from "../../shared/errors/httpErrors/HttpError";
import amountsVsProgrammeRegionService from "../../modules/dataViz/amountsVsProgramRegion/amountsVsProgramRegion.service";

@Route("dataviz")
@Security("jwt")
@Tags("Dataviz Controller")
export class DataVizHttp extends Controller {
    @Get("/montant-versus-programme-region")
    @Response<HttpErrorInterface>("404")
    public async getMontantVsProgrammeRegion(): Promise<GetMontantVsProgrammeRegionResponseDto> {
        const montantVersusProgrammeRegionData = await amountsVsProgrammeRegionService.getAmountsVsProgramRegionData();
        return { montantVersusProgrammeRegionData };
    }
}

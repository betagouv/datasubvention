import type { MontantVsProgrammeRegionDto } from "dto";
import requestsService from "$lib/services/requests.service";

class DataVizPort {
    getResource(resource: string) {
        return requestsService.get(`/dataviz/${resource}`);
    }

    async getAmountsVsProgramRegion(): Promise<MontantVsProgrammeRegionDto[]> {
        return (await this.getResource("montant-versus-programme-region"))?.data.montantVersusProgrammeRegionData;
    }
}

const dataVizPort = new DataVizPort();

export default dataVizPort;

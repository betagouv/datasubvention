import type { MontantVsProgrammeRegionDto } from "dto";
import dataVizPort from "./dataViz.port";

class DataVizService {
    async getAmountsVsProgramRegion(): Promise<MontantVsProgrammeRegionDto[] | undefined> {
        const result = await dataVizPort.getAmountsVsProgramRegion();
        if (!result) return;

        return result;
    }
}

const dataVizService = new DataVizService();

export default dataVizService;

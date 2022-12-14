import statsRepository from "./repositories/statsRepository";
import assoVisitsRepository from "./repositories/assoVisitsRepository";

class StatsService {
    async getNbUsersByRequestsOnPeriod(start: Date, end: Date, minReq: number, includesAdmin: boolean) {
        return await statsRepository.countUsersByRequestNbOnPeriod(start, end, minReq, includesAdmin);
    }

    async getMedianRequestsOnPeriod(start: Date, end: Date, includesAdmin: boolean) {
        return await statsRepository.countMedianRequestsOnPeriod(start, end, includesAdmin);
    }

    async getRequestsPerMonthByYear(year: number, includesAdmin: boolean) {
        return await statsRepository.countRequestsPerMonthByYear(year, includesAdmin);
    }

    getTopAssociations(limit: number) {
        return assoVisitsRepository.selectMostRequestsAssos(limit);
    }
}

const statsService = new StatsService();

export default statsService;

import osirisService from "../osiris/osiris.service";
import ProviderRequestInterface from "./@types/ProviderRequestInterface";
import RequestEntity from "./entities/RequestEntity";
import leCompteAssoService from "../leCompteAsso/leCompteAsso.service";
import entrepriseApiService from "../external/entreprise-api.service";

export class SearchService {

    public async getBySiret(siret: string) {
        const requests = await this.findRequestsBySiret(siret);

        const { result } = requests.reduceRight((acc, request, requestIndex) => {
            acc.stack.splice(requestIndex, 1);

            const similarRequestIndexes: number[] = [];
            acc.stack.forEach((otherRequest, pos) => {
                const key = Object.keys(request.providerInformations).find((key) => otherRequest.providerInformations[key]);

                if (!key || request.providerInformations[key] !== otherRequest.providerInformations[key]) {
                    return;
                }
                similarRequestIndexes.push(pos);
            });

            acc.result.push([request, ...similarRequestIndexes.map(index => acc.stack[index])]);

            similarRequestIndexes.reverse().forEach(index => acc.stack.splice(index, 1));
            return acc;
        }, {result: [] as RequestEntity[][], stack: requests });

        return {
            requests: result,
            rnaAPI: {
                rna: result.length ? await entrepriseApiService.findRnaDataByRna(result[0][0].legalInformations.rna) : null,
                siret: await entrepriseApiService.findRnaDataBySiret(siret)
            },
            siretAPI: await entrepriseApiService.findSiretDataBySiret(siret),
        }
    }

    public async getByRna(rna: string) {
        const requests = await this.findRequestsByRna(rna);

        const { result } = requests.reduceRight((acc, request, requestIndex) => {
            acc.stack.splice(requestIndex, 1);

            const similarRequestIndexes: number[] = [];
            acc.stack.forEach((otherRequest, pos) => {
                const key = Object.keys(request.providerInformations).find((key) => otherRequest.providerInformations[key]);

                if (!key || request.providerInformations[key] !== otherRequest.providerInformations[key]) {
                    return;
                }
                similarRequestIndexes.push(pos);
            });

            acc.result.push([request, ...similarRequestIndexes.map(index => acc.stack[index])]);

            similarRequestIndexes.reverse().forEach(index => acc.stack.splice(index, 1));
            return acc;
        }, {result: [] as RequestEntity[][], stack: requests });

        return {
            requests: result,
            rnaAPI: {
                siret: result.length ? await entrepriseApiService.findRnaDataBySiret(result[0][0].legalInformations.siret) : null,
                rna: await entrepriseApiService.findRnaDataByRna(rna)
            },
            siretAPI: result.length ? await entrepriseApiService.findSiretDataBySiret(result[0][0].legalInformations.siret) : null,
        }
    }

    public findRequestsBySiret(siret: string) {
        return this.findRequests(siret, "siret");
    }

    public findRequestsByRna(rna: string) {
        return this.findRequests(rna, "rna");
    }

    private findRequests(id: string, type: "siret" | "rna") {
        const providers: ProviderRequestInterface[] = [ // Set in method because LCA need Search and Search need LCA (Import loop bugs)
            osirisService,
            leCompteAssoService,
        ];

        return providers.reduce((acc, provider) => {
            return acc.then(async (requests) => {
                if (type === "siret") {
                    requests.push(...await provider.findBySiret(id));
                } else {
                    requests.push(...await provider.findByRna(id));
                }
                return requests;
            });
        }, Promise.resolve([]) as Promise<RequestEntity[]>);
    }
}

const searchService = new SearchService();

export default searchService;
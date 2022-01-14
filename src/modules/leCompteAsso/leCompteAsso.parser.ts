import ILeCompteAssoPartialRequestEntity from "./@types/ILeCompteAssoPartialRequestEntity";
import LeCompteAssoRequestEntity from "./entities/LeCompteAssoRequestEntity";
import * as ParseHelper from "../../shared/helpers/ParserHelper";

export default class LeCompteAssoParser {
    public static parse(content: Buffer): ILeCompteAssoPartialRequestEntity[] {
        const data = content
            .toString()
            .split("\n") // Select line by line
            .map(raw => raw.split(";").map(r => r.split("\t")).flat()) // Parse column
        const header = data[0];
        const raws = data.slice(1);
        return raws.reduce((entities, raw) => {
            if (!raw.map(column => column.trim()).filter(c => c).length) return entities;
            const parsedData = header.reduce((acc, header, key) => {
                acc[header.trim()] = raw[key];
                return acc;
            }, {} as {[key: string]: string});
    
            const legalInformations = {
                siret: ParseHelper.findByPath(parsedData, LeCompteAssoRequestEntity.indexedLegalInformationsPath.siret),
                name: ParseHelper.findByPath(parsedData, LeCompteAssoRequestEntity.indexedLegalInformationsPath.name),
                rna: null
            }
    
            const providerInformations = {
                compteAssoId: ParseHelper.findByPath(parsedData, LeCompteAssoRequestEntity.indexedProviderInformationsPath.compteAssoId),
            };

            entities.push({legalInformations, providerInformations, data: parsedData});
                
            return entities;

        }, [] as ILeCompteAssoPartialRequestEntity[]);
    }
}
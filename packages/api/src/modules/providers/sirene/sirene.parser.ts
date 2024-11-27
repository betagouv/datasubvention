import SireneDto from "../../../dataProviders/api/SIRENE/sireneDto";
import { GenericParser } from "../../../shared/GenericParser";
import * as fs from 'fs';
import csv from 'csv-parser';
import chorusLineRepository from "../chorus/repositories/chorus.line.repository";

export class SireneParser {
    


    static parse(filePath: string): SireneDto[] {
        this.filePathValidator(filePath);
        const fileContent = this.getBuffer(filePath);

        console.info("\nStart parse file: ", filePath);

        const data = GenericParser.xlsParse(fileContent)[0];
        const headers = data[0] as string[];
        const parsedData = data.slice(1).map(row => GenericParser.linkHeaderToData(headers, row)) as SireneDto[];

        return parsedData;
    }

    static async parseCsv(filePath) : Promise<SireneDto[]> {
        this.filePathValidator(filePath);
        console.info("\nStart parsing file: ", filePath);
        const sirenList = await  this.getSirenList();
        console.log('dirrentSiren')
        console.log(sirenList.length);
        return new Promise((resolve, reject) => {
            const results : SireneDto[] = [];
            let currentRow = 0;
            const interval = setInterval(() => {
                console.info(`Downloading: ${currentRow}`);
            }, 5000);
            
            
            
            fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                if (((this.shouldInclude(data, sirenList))) && (currentRow < 500000)) {
                    currentRow++;
                    results.push(data); // Only include if it meets the criteria
                }
            })
            .on('end', () => {
                console.info("Finished parsing file.");
                resolve(results); // Resolve with the filtered results
            })
            .on('error', (error) => {
                console.error("Error reading CSV file:", error);
                reject(error);
            });
        });
    }

    static async getSiretList() {
        return await chorusLineRepository.uniqueSiret();
    }

    static async getSirenList() {
        const siretList = await chorusLineRepository.uniqueSiret();
        const sirenList = Array.from(new Set(siretList.map(siret => siret.slice(0, 9))));
        return sirenList;
    }
    
    static shouldInclude(data, sirenList) {
        const categorieJuridique = data["categorieJuridiqueUniteLegale"];
        const unitePurgee = data["unitePurgeeUniteLegale"];
        const siren = data["siren"];
        
        return (['9210', '9220', '9221', '9222', '9223', '9230', '9240', '9260'].includes(categorieJuridique) && 
        unitePurgee === ''
        && sirenList.includes(siren));
    }

/*
    static async parseWithExcelJs(filePath: string): Promise<SireneDto[]> {
        this.filePathValidator(filePath);
        const workbook = new exceljs.Workbook();
        console.info("\nStart parse file: ", filePath);
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.worksheets[0];
        const headers = worksheet.getRow(1).values as string[];
        const filteredData : SireneDto[] = [];
        // Itérer sur chaque ligne dans la feuille
        console.log('Start parsing');
        worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            
         // Ignorer la première ligne si elle contient les en-têtes
        if (rowNumber === 1) return; 
        if (rowNumber % 1000 === 0) console.log(`Row ${rowNumber}`);
        // Extraire les valeurs de la ligne
        const rowData = row.values; // row.values est un tableau contenant les valeurs de la ligne

        // Vérifier les critères de filtrage
        const categorieJuridique = rowData[28]; 
        const unitePurgee = rowData[3]; 

        if (
            [9210, 9220, 9221, 9222, 9223, 9230, 9240, 9260].includes(categorieJuridique) &&
            unitePurgee === null
        ) {
            if ((Array.isArray(rowData)) && (rowNumber < 1000000) ) {
                filteredData.push(GenericParser.linkHeaderToData(headers, rowData) as unknown as SireneDto);
            }
        }
    });

    return filteredData;
  
    }
    */

    protected static getBuffer(file: string) {
        this.filePathValidator(file);

        console.log("Open and read file ...");

        return fs.readFileSync(file);
    }



    protected static filePathValidator(file: string) {
        if (!file) {
            throw new Error("Parse command need file args");
        }

        if (!fs.existsSync(file)) {
            throw new Error(`File not found ${file}`);
        }
        return true;
    }

    
}


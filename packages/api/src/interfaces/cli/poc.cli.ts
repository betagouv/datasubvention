import path from "path";
import { start } from "repl";
import { CliStaticInterface } from "../../@types";
import { StaticImplements } from "../../decorators/staticImplements.decorator";
import CliController from "../../shared/CliController";
import sireneService from "../../modules/providers/sirene/sirene.service";
import { SireneParser } from "../../modules/providers/sirene/sirene.parser";
import sirenePort from "../../dataProviders/db/SIRENE/sirene.port";
import SireneAdapter from "../../dataProviders/db/SIRENE/sirene.adapter";
import { transferData } from "../../dataProviders/db/SIRENE/sirene.transfer";
import { joinCollection } from "../../dataProviders/db/associationFlat/associationFlatMongo";
import { joinCollectionPostgres } from "../../dataProviders/db/associationFlat/associationFlatPostgres";
import { jointureHybride } from "../../dataProviders/db/associationFlat/associationFlatTypeScript";
import { exportToCsv } from "../../dataProviders/db/paymentFlat/paymentFlatToMinIO";
const DIRECTORY_PATH = "/home/gcarra/data_subvention/api-subventions-asso/packages/api/src/modules/providers/sirene";
@StaticImplements<CliStaticInterface>()
export default class PocCli extends CliController {
    static cmdName = "poc";

    public async test() {
        console.log("unzip");
        //   exportToCsv();

        const start_postgres = performance.now();
        const result_postgres = await joinCollectionPostgres();
        const end_postgres = performance.now();
        const executionTime_postgres = end_postgres - start_postgres;
        console.log(`Execution Time with Postgres: ${executionTime_postgres.toFixed(2)} milliseconds`);

        const start_hybride = performance.now();
        const result_typescript = await jointureHybride();
        const end_hybride = performance.now();
        const executionTime_hybride = end_hybride - start_hybride;
        console.log(`Execution Time hybrid: ${executionTime_hybride.toFixed(2)} milliseconds`);

        //      await sireneService.saveZip("poc-zip");
        //const result = await SireneParser.parseWithDuckDb(path.join(DIRECTORY_PATH, "StockUniteLegale_utf8.csv"));

        const start = performance.now();
        const result = await joinCollection();
        const end = performance.now();
        const executionTime = end - start;
        console.log(`Execution Time with Mongo: ${executionTime.toFixed(2)} milliseconds`);

        // la partie ci-dessous transfère les données de mongo vers postgres
        //  await transferData();
        //   await sireneService.unzip("poc-zipp2mYyapoc-zip.zip", "d");

        // la partie ci-dessous créer la collection sirene à partir du fichier csv
        // const result = await SireneParser.parseCsv(path.join(DIRECTORY_PATH, "StockUniteLegale_utf8.csv"));
        //  await sirenePort.insertMany(result.map(SireneAdapter.toDbo));
    }
}

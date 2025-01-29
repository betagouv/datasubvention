import fs from "fs";
import path from "path";
import csvSyncStringifier = require("csv-stringify/sync");
import FormatDateError from "../../shared/errors/cliErrors/FormatDateError";
import ScdlGrantParser from "../../modules/providers/scdl/scdl.grant.parser";
import scdlService from "../../modules/providers/scdl/scdl.service";
import MiscScdlGrantEntity from "../../modules/providers/scdl/entities/MiscScdlGrantEntity";
import { DuplicateIndexError } from "../../shared/errors/dbError/DuplicateIndexError";
import { ScdlStorableGrant } from "../../modules/providers/scdl/@types/ScdlStorableGrant";
import Siret from "../../valueObjects/Siret";
import { ParsedDataWithProblem } from "../../modules/providers/scdl/@types/Validation";
import { DEV } from "../../configurations/env.conf";
import dataLogService from "../../modules/data-log/dataLog.service";

export default class ScdlCli {
    static cmdName = "scdl";

    // relative path refers to package's root
    static errorsFolderName = "./importErrors";

    public async addProducer(slug: string, name: string, siret: string) {
        if (!slug) throw Error("producer SLUG is mandatory");
        if (!name) throw Error("producer NAME is mandatory");
        if (!siret) throw Error("producer SIRET is mandatory");
        if (!Siret.isSiret(siret)) throw Error("SIRET is not valid");
        if (await scdlService.getProducer(slug)) throw new Error("Producer already exists");
        await scdlService.createProducer({ slug, name, siret, lastUpdate: new Date() });
    }

    public async parseXls(
        file: string,
        producerSlug: string,
        exportDate: string,
        pageName?: string,
        rowOffset: number | string = 0,
    ) {
        await this.validateGenericInput(file, producerSlug, exportDate);
        const parsedRowOffset = typeof rowOffset === "number" ? rowOffset : parseInt(rowOffset);
        const fileContent = fs.readFileSync(file);
        const { entities, errors } = ScdlGrantParser.parseExcel(fileContent, pageName, parsedRowOffset);
        await Promise.all([
            this.persistEntities(entities, producerSlug, exportDate as string),
            this.exportErrors(errors, file),
        ]);
        await dataLogService.addLog(producerSlug, new Date(exportDate), file);
    }

    public async parse(file: string, producerSlug: string, exportDate: string, delimiter = ";", quote = '"') {
        await this.validateGenericInput(file, producerSlug, exportDate);
        const fileContent = fs.readFileSync(file);
        const parsedQuote = quote === "false" ? false : quote;
        const { entities, errors } = ScdlGrantParser.parseCsv(fileContent, delimiter, parsedQuote);
        await Promise.all([
            this.persistEntities(entities, producerSlug, exportDate as string),
            this.exportErrors(errors, file),
        ]);
        await dataLogService.addLog(producerSlug, new Date(exportDate), file);
    }

    private async validateGenericInput(file: string, producerSlug: string, exportDateStr?: string) {
        if (!exportDateStr) throw new FormatDateError();
        const exportDate = new Date(exportDateStr);
        if (isNaN(exportDate.getTime())) throw new FormatDateError();
        if (!(await scdlService.getProducer(producerSlug)))
            throw new Error("Producer ID does not match any producer in database");
    }

    private async persistEntities(entities: ScdlStorableGrant[], producerSlug: string, exportDateStr: string) {
        if (!entities) throw new Error("No entities could be created from this file");

        console.log(`start persisting ${entities.length} grants`);
        let duplicates: MiscScdlGrantEntity[] = [];

        try {
            await scdlService.createManyGrants(entities, producerSlug);
        } catch (e) {
            if (!(e instanceof DuplicateIndexError)) throw e;
            duplicates = (e as DuplicateIndexError<MiscScdlGrantEntity[]>).duplicates;
        }

        if (duplicates.length) {
            console.log(`${duplicates.length} duplicated entries. Here are some of them: `);
            console.log(duplicates.slice(0, 5));
        } else {
            console.log(`No duplicates detected`);
        }

        console.log("Updating producer's last update date");
        await scdlService.updateProducer(producerSlug, { lastUpdate: new Date(exportDateStr) });
        console.log("Parsing ended successfully !");
    }

    private async exportErrors(errors: ParsedDataWithProblem[], file: string) {
        if (!DEV) return;
        const fileName = path.basename(file);
        if (!fs.existsSync(ScdlCli.errorsFolderName)) fs.mkdirSync(ScdlCli.errorsFolderName);
        const outputPath = path.join(ScdlCli.errorsFolderName, fileName + "-errors.csv");

        const csvContent = csvSyncStringifier.stringify(errors, { header: true });

        try {
            fs.writeFileSync(outputPath, csvContent, { flag: "w", encoding: "utf-8" });
        } catch (err) {
            if (err) console.log("Can't write to file");
            else console.log("fields with errors exported in " + path.resolve(outputPath));
        }
    }
}

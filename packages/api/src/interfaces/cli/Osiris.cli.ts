import fs from "fs";

import { StaticImplements } from "../../decorators/staticImplements.decorator";
import { CliStaticInterface } from "../../@types";
import OsirisParser from "../../modules/providers/osiris/osiris.parser";
import osirisService, { VALID_REQUEST_ERROR_CODE } from "../../modules/providers/osiris/osiris.service";
import OsirisActionEntity from "../../modules/providers/osiris/entities/OsirisActionEntity";
import OsirisRequestEntity from "../../modules/providers/osiris/entities/OsirisRequestEntity";
import { COLORS } from "../../shared/LogOptions";
import * as CliHelper from "../../shared/helpers/CliHelper";
import { GenericParser } from "../../shared/GenericParser";
import rnaSirenService from "../../modules/rna-siren/rnaSiren.service";
import Siret from "../../valueObjects/Siret";
import Rna from "../../valueObjects/Rna";
import dataLogService from "../../modules/data-log/dataLog.service";

@StaticImplements<CliStaticInterface>()
export default class OsirisCli {
    static cmdName = "osiris";

    private logFileParsePath = {
        actions: "./logs/osiris.parse.actions.log.txt",
        requests: "./logs/osiris.parse.requests.log.txt",
    };

    public validate(type: string, file: string, extractYear = "2022") {
        if (typeof type != "string" && typeof file != "string" && typeof extractYear != "string") {
            throw new Error("Validate command need type, extractYear and file args");
        }

        if (Number.isNaN(parseInt(extractYear, 10))) {
            throw new Error("extractYear must be a number");
        }

        if (!fs.existsSync(file)) {
            throw new Error(`File not found ${file}`);
        }

        const fileContent = fs.readFileSync(file);

        if (type === "requests") {
            const requests = OsirisParser.parseRequests(fileContent, parseInt(extractYear, 10));

            console.info(`Check ${requests.length} entities!`);
            requests.forEach(entity => {
                const result = osirisService.validRequest(entity);
                if (result !== true) {
                    console.error(`${COLORS.FgRed}${result.message}${COLORS.Reset}`, result.data);
                }
            });

            console.info(`${COLORS.Reset}Validation done`);
        } else if (type === "actions") {
            const actions = OsirisParser.parseActions(fileContent, parseInt(extractYear, 10));
            console.info(`Check ${actions.length} entities!`);
            actions.forEach(entity => {
                const result = osirisService.validAction(entity);
                if (result !== true) {
                    console.error(`${COLORS.FgRed}${result.message}${COLORS.Reset}`, result.data);
                }
            });

            console.info(`${COLORS.Reset}Validation done`);
        } else {
            throw new Error(`The type ${type} is not found`);
        }
    }

    public async parse(type: "requests" | "actions", file: string, extractYear: string): Promise<unknown> {
        if (typeof type != "string" && typeof file != "string" && typeof extractYear != "string") {
            throw new Error("Parse command need type, extractYear and file args");
        }

        if (Number.isNaN(parseInt(extractYear, 10))) {
            throw new Error("extractYear must be a number");
        }

        if (!fs.existsSync(file)) {
            throw new Error(`File not found ${file}`);
        }

        const files = GenericParser.findFiles(file);
        const logs: unknown[] = [];

        console.info(`${files.length} files in the parse queue`);
        console.info(`You can read log in ${this.logFileParsePath}`);

        return files
            .reduce((acc, filePath) => {
                return acc.then(() => this._parse(type, filePath, parseInt(extractYear, 10), logs));
            }, Promise.resolve())
            .then(() =>
                fs.writeFileSync(this.logFileParsePath[type], logs.join(""), {
                    flag: "w",
                    encoding: "utf-8",
                }),
            );
    }

    protected async _parse(type: string, file: string, year: number, logs: unknown[]) {
        console.info("\nStart parse file: ", file);
        logs.push(`\n\n--------------------------------\n${file}\n--------------------------------\n\n`);

        const fileContent = fs.readFileSync(file);

        if (type === "requests") {
            await this._parseRequest(fileContent, year, logs);
        } else if (type === "actions") {
            await this._parseAction(fileContent, year, logs);
        } else {
            throw new Error(`The type ${type} is not taken into account`);
        }

        // this assumes that extraction date is close enough to integration date. Is it?
        await dataLogService.addLog(osirisService.provider.id, new Date(), file);
    }

    private async _parseRequest(contentFile: Buffer, year: number, logs: unknown[]) {
        const requests = OsirisParser.parseRequests(contentFile, year);

        let tictackClock = true;
        const ticTacInterval = setInterval(() => {
            tictackClock = !tictackClock;
            console.log(tictackClock ? "TIC" : "TAC");
        }, 10000);

        const results = await requests.reduce(async (acc, osirisRequest, index) => {
            const data = await acc;

            let validation = osirisService.validRequest(osirisRequest);

            if (validation !== true && validation.code === VALID_REQUEST_ERROR_CODE.INVALID_RNA) {
                const rnaSirenEntities = await rnaSirenService.find(
                    new Siret(osirisRequest.legalInformations.siret).toSiren(),
                );

                if (!rnaSirenEntities || !rnaSirenEntities.length) {
                    validation = osirisService.validRequest(osirisRequest, false); // we still want the request if there is no rna
                } else {
                    osirisRequest.legalInformations.rna = rnaSirenEntities[0].rna.value;
                    validation = osirisService.validRequest(osirisRequest); // Re-validate with the new rna
                }
            }
            CliHelper.printProgress(index + 1, requests.length); // TODO why are you here

            if (validation !== true) {
                logs.push(
                    `\n\nThis request is not registered because: ${validation.message}\n`,
                    JSON.stringify(validation.data, null, "\t"),
                );
            } else data.push(await osirisService.addRequest(osirisRequest));

            return data;
        }, Promise.resolve([]) as Promise<{ state: string; result: OsirisRequestEntity }[]>);
        clearInterval(ticTacInterval);

        const created = results.filter(({ state }) => state === "created");
        console.info(`
            ${results.length}/${requests.length}
            ${created.length} requests created and ${results.length - created.length} requests updated
            ${requests.length - results.length} requests not valid
        `);
    }

    private async _parseAction(contentFile: Buffer, year: number, logs: unknown[]) {
        const actions = OsirisParser.parseActions(contentFile, year);
        const results = await actions.reduce(
            async (acc, osirisAction, index) => {
                const data = await acc;
                const validation = osirisService.validAction(osirisAction);

                CliHelper.printProgress(index + 1, actions.length);

                if (validation !== true) {
                    logs.push(
                        `\n\nThis request is not registered because: ${validation.message}\n`,
                        JSON.stringify(validation.data, null, "\t"),
                    );
                } else data.push(await osirisService.addAction(osirisAction));

                return data;
            },
            Promise.resolve([]) as Promise<
                {
                    state: string;
                    result: OsirisActionEntity;
                }[]
            >,
        );

        const created = results.filter(({ state }) => state === "created");
        console.info(`
            ${results.length}/${actions.length}
            ${created.length} actions created and ${results.length - created.length} actions update
            ${actions.length - results.length} actions not valid
        `);
    }

    async findBySiret(siretStr: string, format?: string) {
        if (typeof siretStr !== "string") {
            throw new Error("Parse command need siret args");
        }

        const siret = new Siret(siretStr);
        const file = await osirisService.findBySiret(siret);

        if (format === "json") {
            console.info(JSON.stringify(file));
        } else {
            console.info(file);
        }
    }

    async findByRna(rnaStr: string, format?: string) {
        if (typeof rnaStr !== "string") {
            throw new Error("Parse command need rna args");
        }

        const rna = new Rna(rnaStr);
        const requests = await osirisService.findByRna(rna);

        if (format === "json") {
            console.info(JSON.stringify(requests));
        } else {
            console.info(requests);
        }
    }
}

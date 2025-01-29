import fs from "fs";
import path from "path";
import ScdlCli from "../cli/Scdl.cli";
import {
    SCDL_FILE_PROCESSING_CONFIG_FILENAME,
    SCDL_FILE_PROCESSING_PATH,
} from "../../configurations/scdlIntegration.conf";
import { FileExtensionEnum } from "../../@enums/FileExtensionEnum";
import {
    ScdlFileProcessingConfig,
    ScdlFileProcessingConfigList,
    ScdlParseArgs,
    ScdlParseXlsArgs,
} from "../../@types/ScdlDataIntegration";

const scdlCli = new ScdlCli();
const successList: string[] = [];
const errorList: string[] = [];

const isConfig = (obj: any): obj is ScdlFileProcessingConfigList => {
    return obj && Array.isArray(obj.files) && obj.files.every(file => isFileConfig(file));
};
const isFileConfig = (file: any): file is ScdlFileProcessingConfig => {
    return (
        file &&
        typeof file.name === "string" &&
        typeof file.parseParams == "object" &&
        file.parseParams !== null &&
        typeof file.parseParams.producerSlug === "string" &&
        typeof file.parseParams.exportDate === "string" &&
        typeof file.addProducer === "boolean"
    );
};

export const loadConfig = (): ScdlFileProcessingConfigList => {
    const filePath = path.resolve(SCDL_FILE_PROCESSING_PATH, SCDL_FILE_PROCESSING_CONFIG_FILENAME);
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data) as ScdlFileProcessingConfigList;
};

export const processFile = async (fileInfo: ScdlFileProcessingConfig) => {
    const { name, parseParams, addProducer, producerName, producerSiret } = fileInfo;
    const dirPath = path.resolve(SCDL_FILE_PROCESSING_PATH);
    const { producerSlug, exportDate, ...optionalParams } = parseParams;

    try {
        if (addProducer && producerName && producerSiret) {
            await scdlCli.addProducer(producerSlug, producerName, producerSiret);
            successList.push(`added producer ${producerSlug}`);
        }
    } catch (e) {
        if ((e as Error).message !== "Producer already exists") {
            errorList.push(
                `added producer ${producerSlug} for file ${name}, data parsing not performed : ${(e as Error).message}`,
            );
            return;
        }
    }

    try {
        const fileType = path.extname(name).slice(1).toLowerCase();
        const filePath = path.join(dirPath, name);
        if (fileType === FileExtensionEnum.CSV) {
            const { delimiter, quote } = optionalParams as ScdlParseArgs;
            await scdlCli.parse(filePath, producerSlug, exportDate, delimiter, quote);
        } else if (fileType === FileExtensionEnum.XLS || fileType === FileExtensionEnum.XLSX) {
            const { pageName, rowOffset } = optionalParams as ScdlParseXlsArgs;
            await scdlCli.parseXls(filePath, producerSlug, exportDate, pageName, rowOffset);
        } else {
            console.error(`❌ Unsupported file type : ${name} (type: ${fileType})`);
            throw new Error(`Unsupported file type : ${filePath}`);
        }
        successList.push(`parse data of ${producerSlug} for file ${name}`);
    } catch (e) {
        errorList.push(`parse data of ${producerSlug} for file ${name} : ${(e as Error).message}`);
    }
};

/**
 * main function to load the file listing .json and launch data integration
 */
export const main = async () => {
    try {
        const config: ScdlFileProcessingConfigList = loadConfig();

        if (!isConfig(config)) {
            throw new Error("Invalid configuration file: The config does not match the expected structure.");
        }
        const filePromises = config.files.map(processFile);
        await Promise.all(filePromises);
    } catch (e) {
        console.trace("❌ Global execution failure.", e);
        errorList.push(`Global execution failure : ${(e as Error).message}`);
        throw e;
    } finally {
        console.log("\n---------------Summary of Operations---------------");
        if (errorList.length === 0) {
            {
                console.log("🚀 All operations completed successfully! 🎯");
            }
        }
        if (successList.length > 0) {
            console.log("✅ list of Success :");
            successList.forEach(desc => console.log(`➡️ ${desc}`));
        }

        if (errorList.length > 0) {
            console.log("⚠️ List of Errors :");
            errorList.forEach(desc => console.log(`❌ ${desc}`));
        }
        process.exit(0);
    }
};

if (require.main === module) {
    main();
}

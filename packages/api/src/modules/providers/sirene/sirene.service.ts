import path from "path";
import sirenePort from "../../../dataProviders/api/SIRENE/sirene.port";
import * as fs from 'fs';
import StreamZip from 'node-stream-zip';

const DIRECTORY_PATH = '/home/gcarra/data_subvention/api-subventions-asso/packages/api/src/modules/providers/sirene';

export class SireneService {
    public async saveZip(destinationDirectoryPath : string, fileName : string) {
       // const destinationDirectory = fs.mkdtempSync(
      //  path.join(directoryPath, directoryName)
  //);

        const file = fs.createWriteStream(destinationDirectoryPath + "/" + fileName);
        const response = await sirenePort.getZip();
      
        console.info(`Start downloading the file`);

        return new Promise((resolve, reject) => {

            response.data.pipe(file);

            let currentLength = 0;
            const interval = setInterval(() => {
            console.info(`Downloading: ${(currentLength / 1_000_000).toFixed(2)} MB`);
            }, 5000);

            response.data.on('data', (chunk) => {
            currentLength += chunk.length;
            });

            file.on("finish", () => {
                console.log("finish");
                file.close();
            });

            file.on("error", error => {
                reject(error);
                console.log("error", error);
            });

            file.on("close", () => {
                resolve("closed");
                console.log("close");
            });
        });

    }

    public async unzip( zipPath: string, destinationDirectoryPath: string
    )  {
        const zip = new StreamZip.async({ file: zipPath});
        await zip.extract(null, destinationDirectoryPath);
        await zip.close();
    };

}

const sireneService = new SireneService();
export default sireneService;

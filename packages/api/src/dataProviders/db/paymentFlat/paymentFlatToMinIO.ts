import {Client} from 'minio';
import chorusLineRepository from "../../../modules/providers/chorus/repositories/chorus.line.repository";
import * as createCsvWriter from 'csv-writer';
import { client } from "../../../shared/MongoConnection";
/*
const minioClient = new Client({
    endPoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: 'giulia',
    secretKey: '61Puzzola'
});
*/
export async function exportToCsv() {
    const csvWriter = createCsvWriter.createObjectCsvWriter({
        path : 'chorus.csv',
        header: [],
    });

    const cursor = chorusLineRepository.cursorFind({
                }, {indexedInformations: 1});

    let count = 0;
    let batch: any[] = [];

    while (await cursor.hasNext()) {
        const doc = await cursor.next();
        console.log(doc);
        batch.push(doc);
        if (batch.length >= 1000) {
            await csvWriter.writeRecords(batch);
            console.log(`Écriture de ${batch.length} documents dans le CSV...`)
            batch = [];
        }
        count++;
    }   

    if (batch.length > 0) {
        await csvWriter.writeRecords(batch);
        console.log(`Écriture de ${batch.length} documents dans le CSV...`)
    }
    console.log(`Export terminé. ${count} documents exportés.`)
    await client.close();
}

import * as fs from "fs";
import path from "path";
import { Client } from "pg";
import { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB } from "../../../configurations/apis.conf";
const pgConfig = {
    user: POSTGRES_USER,
    host: "localhost",
    database: POSTGRES_DB,
    password: POSTGRES_PASSWORD,
    port: 5432,
};

export async function joinCollectionPostgres() {
    const pgClient = new Client(pgConfig);

    try {
        await pgClient.connect();

        const query = `
        SELECT *
        FROM 
        (SELECT siren, 
            SUM(montant) AS last_three_years_subv
        FROM paymentsflat
        WHERE "dateOperation" > (CURRENT_DATE - INTERVAL '3 years')
        GROUP BY siren
        ) AS paymentFlat
        LEFT JOIN (
        SELECT *
        FROM sirene
        ) AS sirene
        ON sirene.siren = paymentFlat.siren
        `;

        const result = await pgClient.query(query);
        /*
        const rows = result.rows; // Les lignes de résultats

        // Écrire les résultats dans un fichier CSV
        const filePath = path.join(__dirname, 'associationFlat_postgres.csv');
        const printed = new Promise ((resolve, reject) => {
            const ws = fs.createWriteStream(filePath);
            fastcsv
                .write(rows, { headers: true }) // Inclure les en-têtes
                .pipe(ws)
                .on('finish', () => {
                    resolve(filePath);
                    console.log(`Exported data to ${filePath}`)

                });
        });
        */
        return result;
    } catch (err) {
        console.error("Error dropping table:", err);
    } finally {
        await pgClient.end();
    }
}

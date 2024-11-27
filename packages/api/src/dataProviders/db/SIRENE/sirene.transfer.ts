import { Client } from "pg";
import { POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER } from "../../../configurations/apis.conf";
import paymentFlatPort from "../paymentFlat/paymentFlat.port";
import sirenePort from "./sirene.port";

const pgConfig = {
    user: POSTGRES_USER,
    host: "localhost",
    database: POSTGRES_DB,
    password: POSTGRES_PASSWORD,
    port: 5432,
};

export async function transferData() {
    const pgClient = new Client(pgConfig);

    try {
        await pgClient.connect();

        console.log("Connected to MongoDB and PostgreSQL");
        /*
        const paymentFlatDocsTemp = await paymentFlatPort.findAll();
        const paymentFlatDocs = paymentFlatDocsTemp.map(doc => ({
            ...doc,
            _id: doc._id.toString(),
        }));
        */
        const sireneDocsTemps = await sirenePort.findAll();
        const sireneDocs = sireneDocsTemps.map(doc => ({
            ...doc,
            _id: doc._id.toString(),
        }));

        //   console.log(Object.keys(paymentFlatDocs[0]))
        //   pgClient.query("DROP TABLE IF EXISTS paymentsFlat");
        pgClient.query("DROP TABLE IF EXISTS sirene");

        const paymentFlatTableQuery = `CREATE TABLE paymentsFlat ( 
        "uniqueId" VARCHAR(200) PRIMARY KEY,    
        "_id" VARCHAR(100) UNIQUE,
        "action" VARCHAR(100),
        "codeAction" VARCHAR(100),
        "dateOperation" DATE,
        "exerciceBudgetaire" NUMERIC(4),
        "ministere" VARCHAR(100),
        "montant" NUMERIC,
        "programme" VARCHAR(100),
        "sigleMinistere" VARCHAR(100),
        "siret" VARCHAR(100),
        "siren" VARCHAR(100),
        "activite" VARCHAR(100),
        "codeActivite" VARCHAR(100),
        "ej" VARCHAR(100),
        "idVersement" VARCHAR(100),
       "mission" VARCHAR(100),
        "numeroProgramme" NUMERIC,
        "provider" VARCHAR(100)
    )`;

        const sireneTableQuery = `CREATE TABLE sirene (
        "_id" VARCHAR(300) UNIQUE,
        "siren" VARCHAR(100) PRIMARY KEY,
        "statutDiffusionUniteLegale" VARCHAR(100),
        "unitePurgeeUniteLegale" VARCHAR(100),
        "dateCreationUniteLegale" DATE,
        "sigleUniteLegale" VARCHAR(100),
        "sexeUniteLegale" VARCHAR(100),
        "prenom1UniteLegale" VARCHAR(100),
        "prenom2UniteLegale" VARCHAR(100),
        "prenom3UniteLegale" VARCHAR(100),
        "prenom4UniteLegale" VARCHAR(100),
        "prenomUsuelUniteLegale" VARCHAR(100),
        "pseudonymeUniteLegale" VARCHAR(100),
        "identifiantAssociationUniteLegale" VARCHAR(100),
        "trancheEffectifsUniteLegale" VARCHAR(100),
        "anneeEffectifsUniteLegale" VARCHAR(100),
        "dateDernierTraitementUniteLegale" DATE,
        "nombrePeriodesUniteLegale" VARCHAR(100),
        "categorieEntreprise" VARCHAR(100),
        "anneeCategorieEntreprise" VARCHAR(100),
        "dateDebut" DATE,
        "etatAdministratifUniteLegale" VARCHAR(100),
        "nomUniteLegale" VARCHAR(300),
        "nomUsageUniteLegale" VARCHAR(300),
        "denominationUniteLegale" VARCHAR(300),
        "denominationUsuelle1UniteLegale" VARCHAR(100),
        "denominationUsuelle2UniteLegale" VARCHAR(100),
        "denominationUsuelle3UniteLegale" VARCHAR(100),
        "categorieJuridiqueUniteLegale" VARCHAR(100),
        "activitePrincipaleUniteLegale" VARCHAR(100),
        "nomenclatureActivitePrincipaleUniteLegale" VARCHAR(100),
        "nicSiegeUniteLegale" VARCHAR(100),
        "economieSocialeSolidaireUniteLegale" VARCHAR(100),
        "societeMissionUniteLegale" VARCHAR(100),
        "caractereEmployeurUniteLegale" VARCHAR(100)
    )`;

        //  await pgClient.query(paymentFlatTableQuery);

        await pgClient.query(sireneTableQuery);
        //   createTableStatement('sirene', Object.keys(sireneDocs[0]));
        /*
        console.log(paymentFlatDocs.length);
        let doc_i = 0;

        for (const doc of paymentFlatDocs) {
            doc_i += 1;
            if (doc_i % 1000 === 0) console.log(doc_i);
            const columns = Object.keys(doc)
                .map(key => `"${key}"`)
                .join(", ");
            const values = Object.values(doc);

            const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

            // Insert into PostgreSQL
            const query = `INSERT INTO paymentsFlat (${columns}) VALUES (${placeholders})`;
            await pgClient.query(query, values);
        }
        console.log(`Data from paymentsFlat transferred successfully`);
        */

        console.log(sireneDocs.length);
        let doc_sirene_i = 0;
        for (const doc of sireneDocs) {
            doc_sirene_i++;
            if (doc_sirene_i % 1000 === 0) console.log(doc_sirene_i);
            const columns = Object.keys(doc)
                .map(key => `"${key}"`)
                .join(", ");
            const values = Object.values(doc);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
            // Insert into PostgreSQL
            const query = `INSERT INTO sirene (${columns}) VALUES (${placeholders})`;
            await pgClient.query(query, values);
        }
    } catch (err) {
        console.error("Error transferring data:", err);
    } finally {
        await pgClient.end();
    }
}

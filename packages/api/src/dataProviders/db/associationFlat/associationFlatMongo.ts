import path from "path";
import fs from "fs";
import db from "../../../shared/MongoConnection";

export async function joinCollection() {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    try {
        const result = db.collection("payments-flat").aggregate([
            {
                $match: {
                    dateOperation: { $gt: threeYearsAgo }, // Filtre pour les trois dernières années
                },
            },
            {
                $group: {
                    _id: "$siren", // Grouper par "siren"
                    last_three_years_subv: { $sum: "$montant" }, // Somme du champ "montant"
                },
            },
            {
                $lookup: {
                    from: "sirene", // Collection à joindre
                    localField: "_id", // Champ local "siren" (renommé "_id" dans le $group)
                    foreignField: "siren", // Champ correspondant dans "sirene"
                    as: "sireneData", // Nom du champ pour les données de "sirene"
                },
            },
            {
                $unwind: {
                    path: "$sireneData",
                    preserveNullAndEmptyArrays: true, // Conserver les documents sans correspondance
                },
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: ["$sireneData", "$$ROOT"], // Fusionne sireneData avec le document actuel
                    },
                },
            },
            {
                $project: {
                    sireneData: 0, // Exclure le champ sireneData si vous ne le voulez pas
                },
            },
        ]);

        /*
    // Chemin du fichier CSV
    const csvFilePath = path.join(__dirname,'associationFlat_mongodb.csv');
    const writeStream = fs.createWriteStream(csvFilePath);

        // Configuration de `fast-csv` pour écrire dans le fichier
    const csvStream = format({ headers: true });

        // Redirige `csvStream` vers `writeStream`
    csvStream.pipe(writeStream).on('end', () => {
            console.log(`Les résultats ont été enregistrés dans ${csvFilePath}`);
    });

        // Boucle sur chaque document du curseur MongoDB
    */

        const toReturn = await result.toArray();

        //csvStream.end();
        return toReturn;
    } catch (err) {
        console.error("Error joining collections:", err);
    }
}

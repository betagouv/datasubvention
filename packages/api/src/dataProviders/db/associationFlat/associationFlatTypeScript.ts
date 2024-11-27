import db from "../../../shared/MongoConnection";

export async function jointureHybride() {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    let paymentFlatCollection: any[] = [];
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
        ]);
        paymentFlatCollection = await result.toArray();
    } catch (err) {
        console.error(err);
    }
    let sireneCollection: any[] = [];
    try {
        const result = db.collection("sirene").find({});
        sireneCollection = await result.toArray();
    } catch (err) {
        console.error(err);
    }

    const sireneMap = new Map(sireneCollection.map(asso => [asso.siren, asso]));
    // Jointure gauche
    const result = paymentFlatCollection.map(payment => {
        const assoInfo = sireneMap.get(payment._id);

        // Retourner un objet combiné
        return {
            ...payment,
            ...(assoInfo || {}),
        };
    });
    return result;
}

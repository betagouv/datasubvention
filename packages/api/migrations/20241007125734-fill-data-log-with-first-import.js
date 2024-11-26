const osirisService = require("../build/src/modules/providers/osiris/osiris.service").default;
const fonjepService = require("../build/src/modules/providers/fonjep/fonjep.service").default;
const chorusService = require("../build/src/modules/providers/chorus/chorus.service").default;

module.exports = {
    async up(db) {
        const buildDataLog = (provider, integ, edit) => ({
            providerId: provider,
            integrationDate: integ,
            editionDate: edit,
            fileName: "not available at this time",
        });

        const stateProviders = [
            buildDataLog(osirisService.provider.id, new Date("2022-02"), new Date("2022-02")),
            buildDataLog(fonjepService.provider.id, new Date("2022-05"), new Date("2022-03")),
            buildDataLog(chorusService.provider.id, new Date("2022-02"), new Date("2022-02")),
        ];

        const scdlProviders = [
            buildDataLog("centre-val-de-loire", new Date("2023-12-14"), new Date("2019-12-31")),
            buildDataLog("lys-saint-georges", new Date("2023-12-14"), new Date("2020-09-24")),
            buildDataLog("grand-est", new Date("2024-03"), new Date("2023-02-10")),
            buildDataLog("lyon", new Date("2024-03"), new Date("2023-12-31")),
            buildDataLog("ademe", new Date("2024-03"), new Date("2023-09-07")),
            buildDataLog("normandie", new Date("2024-04"), new Date("2023-12-11")),
            buildDataLog("paris", new Date("2024-04"), new Date("2020-12-31")),
            buildDataLog("bretagne", new Date("2024-04"), new Date("2024-02-26")),
            buildDataLog("aix-marseille-provence", new Date(), new Date("2023-12-07")),
            buildDataLog("aura", new Date("2024-07"), new Date("2024-06-03")),
            buildDataLog("antibes", new Date("2024-08"), new Date("2024-03-06")),
        ];

        await db.collection("data-log").insertMany([...stateProviders, ...scdlProviders]);
    },
};

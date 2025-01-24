const qs = require("qs");
const axios = require("axios");

class OsirisPosibilitiesBuilder {
    constructor(year, reportName, cookie, debug = false) {
        (this.year = year), (this.reportName = reportName);
        this.debug = debug;
        this.cookie = cookie;
        this.computedCookies = this.cookie.map(c => `${c.name}=${c.value};`).join(" ");
        this.BASE_URL = "https://osiris.extranet.jeunesse-sports.gouv.fr";

        this.cache = {};
    }

    buildPosibilities() {
        return this.__getPosibilitiesTypeFinancement();
    }

    async __sendGetRequest(url) {
        return axios.default.request({
            url: this.BASE_URL + url,
            method: "get",
            headers: {
                Cookie: this.computedCookies,
            },
        });
    }

    async __isValid(posibility) {
        const response = await this.__sendGetRequest(
            "/Statistique/GetNombreSuiviActionDossier?" + qs.stringify(posibility),
        );
        return response.data;
    }

    __buildDefaultPosibilty() {
        return {
            ProgrammeTypeFinancementId: "1",
            SousTypeFinancementId: "",
            Annee: this.year || new Date().getFullYear().toString(),
            ServiceId: "1",
            IncludeSs: "True",
            GestionnaireId: "",
            IsPluriannuel: "",
            ReportName: this.reportName || "SuiviDossiers",
            TypeFederationId: "",
        };
    }

    async __getProgrammes() {
        const response = await this.__sendGetRequest("/Referentiel/GetListPtfForMyUser/");
        return response.data.filter(p => !p.Disabled);
    }

    async __getSousTypeFinancement(programe) {
        const response = await this.__sendGetRequest(
            "/Statistique/GetSousTypeFinancement?programmeTypeFinancementId=" + programe,
        );
        return response.data.filter(p => !p.Disabled);
    }

    async __getService(posibility) {
        const response = await this.__sendGetRequest(
            `/Referentiel/GetMySelectListServicesLectureParPtf/?ptfIdsStr=["${posibility.ProgrammeTypeFinancementId}"]&addDefault=false`,
        );
        return response.data.filter(p => !p.Disabled);
    }

    __getPlurianual() {
        if (this.reportName === "SuiviDossiers") {
            return [
                {
                    Value: "False",
                    Text: "Annuel",
                },
                {
                    Value: "True",
                    Text: "PluriAnnuel",
                },
            ];
        }

        return [
            {
                Value: undefined,
                Text: "Disabled",
            },
        ];
    }

    __getFederation() {
        return [
            {
                Value: "1",
                Text: "Affinitaires",
            },
            {
                Value: "2",
                Text: "Divers",
            },
            {
                Value: "3",
                Text: "Groupements nationaux",
            },
            {
                Value: "4",
                Text: "Handicapés",
            },
            {
                Value: "5",
                Text: "Non Olympiques",
            },
            {
                Value: "6",
                Text: "Olympiques",
            },
            {
                Value: "7",
                Text: "Scolaires Universitaires",
            },
        ];
    }

    async __getPosibilitiesTypeFinancement() {
        const programmes = await this.__getProgrammes();

        const posibilities = [];

        console.log("Get posiblities ....");

        await programmes.reduce(async (acc, p) => {
            await acc;
            console.log({ posibilities: posibilities.length });
            const posibility = this.__buildDefaultPosibilty();
            posibility.ProgrammeTypeFinancementId = p.Value;

            if (await this.__isValid(posibility)) {
                posibilities.push(posibility);
                return posibilities;
            }

            posibilities.push(...(await this.__getPosibilitiesSousTypeFinancement(posibility)));
        }, Promise.resolve());

        console.log("Total valid posibilities :", posibilities.length);

        return posibilities;
    }

    async __getPosibilitiesSousTypeFinancement(posibility) {
        const sousTypes = await this.__getSousTypeFinancement(posibility.ProgrammeTypeFinancementId);
        return sousTypes.reduce(async (acc, subType) => {
            const posibilities = await acc;
            const subTypePosibility = Object.assign({}, posibility);
            subTypePosibility.SousTypeFinancementId = subType.Value;

            if (await this.__isValid(subTypePosibility)) {
                posibilities.push(subTypePosibility);
                return posibilities;
            }

            const result = await this.__getPosibilitiesServices(subTypePosibility);
            return posibilities.concat(result);
        }, Promise.resolve([]));
    }

    async __getPosibilitiesServices(posibility) {
        posibility.IncludeSs = "False";

        const services = await this.__getService(posibility);
        return services.reduce(async (acc, service) => {
            const posibilities = await acc;

            const servicePosibility = Object.assign({}, posibility);
            servicePosibility.ServiceId = service.Value;
            if (await this.__isValid(servicePosibility)) {
                posibilities.push(servicePosibility);
                return posibilities;
            }

            return posibilities.concat(await this.__getPosibilitiesPlurianual(servicePosibility));
        }, Promise.resolve([]));
    }

    async __getPosibilitiesPlurianual(posibility) {
        if (posibility.ProgrammeTypeFinancementId == "1") {
            // Choice is disable in UI
            return this.__getPosibilitiesTypeFederation(posibility);
        }
        const selections = this.__getPlurianual();

        return selections.reduce(async (acc, selection) => {
            const posibilities = await acc;

            const selectionPosibility = Object.assign({}, posibility);
            selectionPosibility.IsPluriannuel = selection.Value;
            if (await this.__isValid(selectionPosibility)) {
                posibilities.push(selectionPosibility);
                return posibilities;
            }

            return posibilities.concat(await this.__getPosibilitiesTypeFederation(selectionPosibility));
        }, Promise.resolve([]));
    }

    async __getPosibilitiesTypeFederation(posibility) {
        const available = ["15", "16", "21", "22", "23"];

        if (!available.includes(posibility.ProgrammeTypeFinancementId)) return [];

        const selections = this.__getFederation();
        return selections.reduce(async (acc, selection) => {
            const posibilities = await acc;

            const selectionPosibility = Object.assign({}, posibility);
            selectionPosibility.IsPluriannuel = selection.Value;

            if (await this.__isValid(selectionPosibility)) {
                posibilities.push(selectionPosibility);
            }

            return posibilities;
        }, Promise.resolve([]));
    }
}

module.exports = OsirisPosibilitiesBuilder;

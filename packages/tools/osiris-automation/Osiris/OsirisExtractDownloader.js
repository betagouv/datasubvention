const fs = require("fs");
const axios = require("axios");
const qs = require("qs");
const OsirisSignalrConnector = require("./OsirisSignalrConnector");

class OsirisExtractDownloader {
    constructor(cookie, year, reportName, debug = false) {
        this.connector = new OsirisSignalrConnector(cookie, debug);
        this.BASE_URL = "https://osiris.extranet.jeunesse-sports.gouv.fr/";
        this.connectionCookies = cookie;
        this.debug = debug;
        this.year = year;
        this.reportName = reportName;

        this.currentDownloadFileName = "";
        this.currentDownloadCallback = null;
        this.currentDownloadCallbackError = null;
        this.isDisabled = false;

        this.reports = [];
        this.chunks = [];

        this.connector.onStatus((...agrs) => this.__onStatus(...agrs));
        this.connector.onContent((...agrs) => this.__onContent(...agrs));
        this.connector.onError((...args) => {
            this.isDisabled = true;
            if (this.currentDownloadCallbackError) this.currentDownloadCallbackError(...args);
        });

        this.__clearReportDir(reportName);
        this.loadPromise = this.connector.connect();
    }

    async download(posibility, getCookie) {
        await this.loadPromise;
        if (this.currentDownloadCallback) throw new Error("Please download file one by one"); // Techniquement possible de télécharger plusieurs fichiers en même temps, mais imposible de les nommer correctement

        // eslint-disable-next-line no-async-promise-executor -- old code that works
        return new Promise(async (resolve, reject) => {
            this.currentDownloadFileName = this.__buildFileName(posibility);

            this.currentDownloadCallback = resolve;
            this.currentDownloadCallbackError = reject;

            const result = await this.__sendExtarctOrder(posibility, getCookie);

            console.log(result.status);
        });
    }

    async __sendExtarctOrder(posibility, getCookie) {
        var url = "Statistique/SuiviActionDossier/";
        const sendRequest = () => {
            return axios.default.request({
                url: this.BASE_URL + url,
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Cookie: this.connectionCookies.map(c => `${c.name}=${c.value};`).join(" "),
                },
                data: qs.stringify(posibility),
                timeout: 0,
            });
        };

        try {
            return await sendRequest();
        } catch (e) {
            console.log(e, "Retry send request, please wait 10s");
            return new Promise(resolve => {
                setTimeout(async () => {
                    this.connectionCookies = await getCookie();
                    resolve(await sendRequest());
                }, 1000 * 10);
            });
        }
    }

    __buildFileName(posibility) {
        return `${posibility.Annee}-${posibility.ProgrammeTypeFinancementId}-${posibility.SousTypeFinancementId}-${posibility.ServiceId}-${posibility.IsPluriannuel}`;
    }

    __onStatus(result) {
        if (this.isDisabled) return;
        this.reports.push({
            ...result,
            ChunkReceived: 0,
        });

        this.__checkToSave(result.Identifier);
    }

    __onContent(chunk) {
        if (this.isDisabled) return;
        if (!chunk.Part) {
            console.log(chunk.Part);
            return;
        }

        this.chunks.push({
            ...chunk,
        });

        this.__checkToSave(chunk.ReportId);
    }

    __checkToSave(id) {
        let report = this.reports.find(report => report.Identifier == id);
        if (!report) return;

        const chunkReceived = this.chunks.filter(p => p.ReportId == id);
        report.ChunkReceived = chunkReceived.length;

        console.log(`ChunkReceived: ${chunkReceived.length}/${report.ChunkCount}`);

        if (!chunkReceived || chunkReceived.length != report.ChunkCount) return;

        console.log("File is complete");
        const contentArray = new Uint8Array(report.ReportSize);

        chunkReceived.forEach(item => {
            const byteArray = this.__partToArrayBuffer(item.Part);
            for (var i = item.Offset; i < item.Offset + item.ChunkSize; i++) {
                contentArray[i] = byteArray[i - item.Offset];
            }
        });

        // File has been build, so remove chunks and report of file in the memory
        this.chunks = this.chunks.filter(p => p.ReportId != report.Identifier);
        this.reports = this.reports.filter(r => r.Identifier != report.Identifier);

        this.__save(report.FileName, contentArray);
    }

    __partToArrayBuffer(base64Content) {
        // this code comes from Osiris web page
        const binaryString = global.atob(base64Content);
        const binaryLen = binaryString.length;
        const bytes = new Uint8Array(binaryLen);
        for (let i = 0; i < binaryLen; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    __save(name, byte) {
        if (!this.currentDownloadCallback) return;
        console.log("Saving ...");
        fs.writeFileSync(
            `./extract/${this.year}/${this.reportName}/` + this.currentDownloadFileName + name,
            byte,
            err => err && console.error(err),
        );
        const cb = this.currentDownloadCallback;
        this.currentDownloadCallback = null;
        console.log("Saved !");
        cb();
    }

    __clearReportDir(reportName) {
        const dirPath = `./extract/`;
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
        }

        if (!fs.existsSync(dirPath + this.year)) {
            fs.mkdirSync(dirPath + this.year);
        }

        if (!fs.existsSync(dirPath + this.year + "/" + reportName)) {
            fs.mkdirSync(dirPath + this.year + "/" + reportName);
        }
    }
}

module.exports = OsirisExtractDownloader;

import ProviderRequestFactory, {
    ProviderRequestService,
} from "../../../modules/provider-request/providerRequest.service";

export class SirenePort {
    private URL = "https://files.data.gouv.fr/insee-sirene/StockUniteLegale_utf8.zip";

    private http: ProviderRequestService;

    constructor() {
        this.http = ProviderRequestFactory("sirene");
    }

    getZip() {
        return this.http.get(this.URL, { responseType: "stream" });
    }
}

const sirenePort = new SirenePort();
export default sirenePort;

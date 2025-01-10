import { Association, Etablissement, DocumentDto } from "dto";
import { XMLParser } from "fast-xml-parser";
import * as Sentry from "@sentry/node";
import { ProviderEnum } from "../../../@enums/ProviderEnum";
import { DefaultObject, StructureIdentifier } from "../../../@types";
import { API_ASSO_URL, API_ASSO_TOKEN } from "../../../configurations/apis.conf";
import CacheData from "../../../shared/Cache";
import { CACHE_TIMES } from "../../../shared/helpers/TimeHelper";
import AssociationsProvider from "../../associations/@types/AssociationsProvider";
import DocumentProvider from "../../documents/@types/DocumentsProvider";
import EtablissementProvider from "../../etablissements/@types/EtablissementProvider";
import { hasEmptyProperties } from "../../../shared/helpers/ObjectHelper";
import ProviderCore from "../ProviderCore";
import AssociationIdentifier from "../../../valueObjects/AssociationIdentifier";
import Rna from "../../../valueObjects/Rna";
import Siren from "../../../valueObjects/Siren";
import EstablishmentIdentifier from "../../../valueObjects/EstablishmentIdentifier";
import ApiAssoDtoAdapter from "./adapters/ApiAssoDtoAdapter";
import StructureDto, {
    DocumentsDto,
    StructureDacDocumentDto,
    StructureDocumentDto,
    StructureRnaDocumentDto,
} from "./dto/StructureDto";
import { RnaStructureDto } from "./dto/RnaStructureDto";
import { SirenStructureDto } from "./dto/SirenStructureDto";

export class ApiAssoService
    extends ProviderCore
    implements AssociationsProvider, EtablissementProvider, DocumentProvider
{
    // API documented in part "contrat d'interface" https://lecompteasso.associations.gouv.fr/lapi-association/
    private requestCache = new CacheData<unknown>(CACHE_TIMES.ONE_DAY);

    constructor() {
        super({
            name: "API ASSO",
            type: ProviderEnum.api,
            id: "api_asso",
            description:
                "L'API Asso est une API portée par la DJEPVA et la DNUM des ministères sociaux qui expose des données sur les associations issues du RNA, de l'INSEE (SIREN/SIRET) et du Compte Asso.",
        });
    }

    private async sendRequest<T>(route: string): Promise<T | null> {
        if (this.requestCache.has(route)) return this.requestCache.get(route)[0] as T;

        try {
            const res = await this.http.get<T>(`${API_ASSO_URL}/${route}`, {
                headers: {
                    Accept: "application/json",
                    "X-Gravitee-Api-Key": API_ASSO_TOKEN as string,
                },
            });

            if (res.status === 200 && (typeof res.data != "string" || !res.data.includes("Error"))) {
                this.requestCache.add(route, res.data);
                return res.data;
            }
            return null;
        } catch {
            return null;
        }
    }

    public async findRnaSirenByIdentifiers(identifier: AssociationIdentifier) {
        const value = identifier.getValue(["siren", "rna"]);

        if (!value) return { rna: undefined, siren: undefined };

        const structure = await this.sendRequest<StructureDto>(`/api/structure/${value}`);
        // TODO: investigate with JFM
        // some times apiAsso return a 404
        // ex: siren 422606285
        if (!structure?.identite) return { rna: undefined, siren: undefined };

        const rnaValue = structure?.identite?.id_rna;
        const sirenValue = structure?.identite.id_siren?.toString(); // sometimes siren is string or number;

        return {
            rna: rnaValue ? new Rna(rnaValue) : undefined,
            siren: sirenValue ? new Siren(sirenValue) : undefined,
        };
    }

    public async findAssociationByRna(rna: Rna): Promise<Association | null> {
        const rnaStructure = await this.sendRequest<RnaStructureDto>(`/api/rna/${rna.value}`);

        if (!rnaStructure) return null;
        if (hasEmptyProperties(rnaStructure.identite) || !rnaStructure.identite.date_modif_rna) return null; // sometimes an empty shell object if given by the api
        return ApiAssoDtoAdapter.rnaStructureToAssociation(rnaStructure);
    }

    private getDefaultDateModifSiren(structure: StructureDto | SirenStructureDto) {
        return structure.identite?.date_creation_sirene || "1900-01-01";
    }

    public async findAssociationBySiren(siren: Siren): Promise<Association | null> {
        const sirenStructure = await this.sendRequest<SirenStructureDto>(`/api/siren/${siren.value}`);

        const isSirenStructureValid = structure => structure.etablissement && structure.etablissement.length;

        if (!sirenStructure || !isSirenStructureValid(sirenStructure)) {
            const structure = await this.sendRequest<SirenStructureDto>(`/api/structure/${siren.value}`);
            if (!structure || hasEmptyProperties(structure.identite)) return null;
            if (!structure.identite.date_modif_siren)
                structure.identite.date_modif_siren = this.getDefaultDateModifSiren(structure);
            return ApiAssoDtoAdapter.sirenStructureToAssociation(structure);
        }
        if (!sirenStructure?.identite || !Object.keys(sirenStructure.identite).length) return null; // sometimes an empty shell object if given by the api

        if (!sirenStructure.identite.date_modif_siren)
            sirenStructure.identite.date_modif_siren = this.getDefaultDateModifSiren(sirenStructure);

        return ApiAssoDtoAdapter.sirenStructureToAssociation(sirenStructure);
    }

    private async findEtablissementsBySiren(siren: Siren): Promise<Etablissement[]> {
        const structure = await this.sendRequest<StructureDto>(`/api/structure/${siren.value}`);

        if (!structure?.identite || !Object.keys(structure.identite).length || hasEmptyProperties(structure.identite))
            return []; // sometimes an empty shell object if given by the api

        if (!structure.identite.date_modif_siren)
            structure.identite.date_modif_siren = this.getDefaultDateModifSiren(structure);

        const establishments = structure.etablissement || [];

        const ribs = structure.rib || [];

        return establishments
            .filter(establishment => establishment)
            .map(establishment =>
                ApiAssoDtoAdapter.toEtablissement(
                    establishment,
                    ribs,
                    structure.representant_legal,
                    structure.identite.date_modif_siren,
                ),
            );
    }

    private filterRnaDocuments(documents: StructureRnaDocumentDto[]) {
        const acceptedType = [
            "MD", // récépissé de modification
            "CR", //"Récépissé de création"
            "LDC", // liste des dirigeants
            "PV", // procès verbal
            "STC", // statuts
        ];

        const sortByYearAndTimeAsc = (a: StructureRnaDocumentDto, b: StructureRnaDocumentDto) => {
            return parseFloat(`${a.annee}.${a.time}`) - parseFloat(`${b.annee}.${b.time}`);
        };

        return acceptedType
            .map(type =>
                documents
                    .filter(document => document["sous_type"].toLocaleUpperCase() === type)
                    .sort(sortByYearAndTimeAsc)
                    // Get most recent document
                    .pop(),
            )
            .filter(document => document) as StructureRnaDocumentDto[];
    }

    private filterDacDocuments(documents: StructureDacDocumentDto[]) {
        const acceptedType = [
            "RFA", // rapports financier ou moral
            "BPA", // budget prévisionnel annuel
            "RCA", // Rapport du commissaire aux compte
            "RAR", // Rapport d'activité
            "Rapport du commissaire aux comptes", // comptes du dernier exercice clôt
            "Jeunesse et Education Populaire (JEP)",
            "Education nationale",
            "Formation", // L'habilitation d'organisme de formation
            "Service Civique", // agrement service civique
            "AGR", // arrêté de l'agrement
            "AFF", // Attestation d’affiliation
            "PRS", // Projet associatif
        ];

        const sortByTimeDepotAsc = (a: StructureDacDocumentDto, b: StructureDacDocumentDto) =>
            new Date(a.time_depot).getTime() - new Date(b.time_depot).getTime();

        return acceptedType
            .map(type =>
                documents
                    .filter(document => document.meta.type.toLocaleUpperCase() === type.toLocaleUpperCase())
                    .sort(sortByTimeDepotAsc)
                    // Get most recent document
                    .pop(),
            )
            .filter(document => document) as StructureDacDocumentDto[];
    }

    private filterRibsInDacDocuments(documents: StructureDacDocumentDto[]) {
        const ribs = documents.filter(
            document =>
                document.meta.type.toLocaleUpperCase() === "RIB" && document.url && document.meta.iban !== "null",
        );

        const uniquesRibs = ribs.reduce((acc, rib) => {
            const ribName = rib.meta.iban || rib.nom;
            if (!acc[ribName] || new Date(rib.time_depot).getTime() > new Date(acc[ribName].time_depot).getTime()) {
                acc[ribName] = rib;
            }
            return acc;
        }, {} as DefaultObject<StructureDacDocumentDto>);

        return Object.values(uniquesRibs);
    }

    private filterActiveDacDocuments(documents: StructureDacDocumentDto[], structureIdentifier: StructureIdentifier) {
        if (!Array.isArray(documents)) {
            if ((documents as Record<string, unknown>).uuid !== undefined) {
                // When api have one document, it is not an array but a single object
                documents = [documents];
            } else {
                const errorMessage =
                    "API-ASSO structure do not contain documents or format is not supported. Structure identifier => " +
                    structureIdentifier.toString();
                Sentry.captureException(new Error(errorMessage));
                console.error(errorMessage);
                return [];
            }
        }
        return documents.filter(document => document.meta.etat === "courant");
    }

    private async fetchDocuments(identifier: AssociationIdentifier): Promise<DocumentsDto | undefined> {
        const identifierValue = identifier.getValue(["siren", "rna"]);

        if (!identifierValue) {
            throw new Error("Identifier not supported for documents fetching.");
        }

        const result = await this.sendRequest<StructureDocumentDto>(`/proxy_db_asso/documents/${identifierValue}`);

        if (typeof result == "string") {
            const parser = new XMLParser();
            const jsonResult = parser.parse(result) as StructureDocumentDto;
            return jsonResult?.asso?.documents;
        }

        return result?.asso?.documents;
    }

    /*
    for now does not work because we get 401
     */
    private async validateDocAvailability(docUrl: string): Promise<boolean> {
        if (!docUrl) return false;
        const res = await this.http
            .options(docUrl, {
                headers: {
                    Accept: "application/json",
                    "X-Gravitee-Api-Key": API_ASSO_TOKEN as string,
                },
            })
            .catch(e => e);
        return res.status !== 404;
    }

    private async filterAvailableDocs<T extends { url: string }>(docs: T[]): Promise<T[]> {
        const validatedDocs: T[] = [];
        await Promise.all(
            docs.map(doc =>
                this.validateDocAvailability(doc.url).then(validation => {
                    if (validation) validatedDocs.push(doc);
                }),
            ),
        );
        return validatedDocs;
    }

    private async findRibs(identifier: AssociationIdentifier) {
        const documents = await this.fetchDocuments(identifier);
        if (!documents) return [];
        const activeDacDocuments = this.filterActiveDacDocuments(documents.document_dac || [], identifier);
        const ribs = this.filterRibsInDacDocuments(activeDacDocuments);
        return ribs.map(rib => ApiAssoDtoAdapter.dacDocumentToRib(rib));
    }

    private async findDocuments(identifier: AssociationIdentifier): Promise<DocumentDto[]> {
        const documents = await this.fetchDocuments(identifier);

        if (!documents) return [];

        const [availableRnaDocs, availableDacDocs] = await Promise.all([
            this.filterAvailableDocs(documents.document_rna || []),
            this.filterAvailableDocs(documents.document_dac || []),
        ]);

        const filteredRnaDocument = this.filterRnaDocuments(availableRnaDocs);
        const activeDacDocuments = this.filterActiveDacDocuments(availableDacDocs, identifier);
        const filteredDacDocument = this.filterDacDocuments(activeDacDocuments);
        const ribs = this.filterRibsInDacDocuments(activeDacDocuments);

        return [
            ...filteredRnaDocument.map(document => ApiAssoDtoAdapter.rnaDocumentToDocument(document)),
            ...filteredDacDocument.map(document => ApiAssoDtoAdapter.dacDocumentToDocument(document)),
            ...ribs.map(document => ApiAssoDtoAdapter.dacDocumentToRib(document)),
        ];
    }

    /**
     * |-------------------------|
     * |    Associations Part    |
     * |-------------------------|
     */

    isAssociationsProvider = true;

    async getAssociations(identifier: AssociationIdentifier): Promise<Association[]> {
        const associations: Association[] = [];

        if (identifier.siren) {
            const sirenAssociation = await this.findAssociationBySiren(identifier.siren);

            if (sirenAssociation) associations.push(sirenAssociation);
        }

        if (identifier.rna) {
            const rnaAssociation = await this.findAssociationByRna(identifier.rna);

            if (rnaAssociation) associations.push(rnaAssociation);
        }

        return associations;
    }

    /**
     * |-------------------------|
     * |   Etsablishment Part    |
     * |-------------------------|
     */

    isEtablissementProvider = true;

    async getEstablishments(identifier: StructureIdentifier): Promise<Etablissement[]> {
        if (identifier instanceof AssociationIdentifier && identifier.siren) {
            return this.findEtablissementsBySiren(identifier.siren);
        } else if (identifier instanceof EstablishmentIdentifier && identifier.siret) {
            const siren = identifier.siret.toSiren();
            const result = await this.findEtablissementsBySiren(siren);
            return result.filter(establishment => establishment.siret[0].value == identifier.siret?.value);
        }
        return [];
    }

    /**
     * |---------------------|
     * |   Documents Part    |
     * |---------------------|
     */

    isDocumentProvider = true;

    async getDocuments(identifier: StructureIdentifier): Promise<DocumentDto[]> {
        if (identifier instanceof AssociationIdentifier) {
            return this.findDocuments(identifier);
        }

        if (!identifier.siret) {
            throw new Error("Invalid identifier type");
        }

        const documents = await this.findDocuments(identifier.associationIdentifier);
        return documents.filter(document => document.__meta__.siret == identifier.siret?.value);
    }

    async getRibs(identifier: EstablishmentIdentifier) {
        if (!identifier.siret) return [];
        const ribs = await this.findRibs(identifier.associationIdentifier);

        return ribs.filter(rib => rib.__meta__.siret === identifier.siret?.value);
    }
}

const apiAssoService = new ApiAssoService();

export default apiAssoService;

import { DemandeSubvention } from "dto";
import Flux from "../../shared/Flux";
import associationsService from "../../modules/associations/associations.service";
import { AssociationHttp, isAssoIdentifierFromAssoMiddleware } from "./Association.http";
import consumers from "stream/consumers";
import grantService from "../../modules/grant/grant.service";
import associationIdentifierService from "../../modules/association-identifier/association-identifier.service";
import AssociationIdentifier from "../../valueObjects/AssociationIdentifier";
import Siren from "../../valueObjects/Siren";
import grantExtractService from "../../modules/grant/grantExtract.service";
import associationService from "../../modules/associations/associations.service";
import { errorHandler } from "../../middlewares/ErrorMiddleware";

jest.mock("../../modules/grant/grant.service");
jest.mock("../../modules/grant/grantExtract.service");
jest.mock("../../modules/association-identifier/association-identifier.service");
jest.mock("../../middlewares/ErrorMiddleware");
jest.mock("../../modules/associations/associations.service");

const controller = new AssociationHttp();

const ID_STR = "000000001";
const IDENTIFIER = new Siren(ID_STR);
const ASSOCIATION_ID = AssociationIdentifier.fromSiren(IDENTIFIER);

describe("AssociationHttp", () => {
    let getIdentifierSpy: jest.SpyInstance;
    const REQ = { params: { identifier: ID_STR }, assoIdentifier: ASSOCIATION_ID };

    beforeAll(() => {
        jest.mocked(associationIdentifierService.getOneAssociationIdentifier).mockResolvedValue(ASSOCIATION_ID);

        getIdentifierSpy = jest.spyOn(controller, "getIdentifier").mockResolvedValue(ASSOCIATION_ID);
    });

    describe("getIdentifier", () => {
        beforeAll(() => {
            getIdentifierSpy.mockRestore();
        });
        afterAll(() => {
            getIdentifierSpy.mockResolvedValue(ASSOCIATION_ID);
        });

        it("returns identifier from req if exists", async () => {
            const expected = "ID-from-request";
            const actual = await controller.getIdentifier({ assoIdentifier: "ID-from-request" }, "ID");
            expect(actual).toBe(expected);
        });

        it("does not call service if identifier in req", async () => {
            await controller.getIdentifier({ assoIdentifier: "ID-from-request" }, "ID");
            expect(associationIdentifierService.getOneAssociationIdentifier).not.toHaveBeenCalled();
        });

        it("calls service if identifier not in req", async () => {
            await controller.getIdentifier({}, "ID");
            expect(associationIdentifierService.getOneAssociationIdentifier).toHaveBeenCalledWith("ID");
        });

        it("returns identifier from service if not in request", async () => {
            const expected = ASSOCIATION_ID;
            const actual = await controller.getIdentifier({}, "ID");
            expect(actual).toBe(expected);
        });
    });

    describe("getDemandeSubventions", () => {
        const getSubventionsSpy = jest.spyOn(associationsService, "getSubventions");
        it("should call service with args", async () => {
            const subventions = [{}] as DemandeSubvention[];
            const flux = new Flux(subventions);
            flux.close();
            // @ts-expect-error: mock
            getSubventionsSpy.mockReturnValueOnce(flux);
            await controller.getDemandeSubventions(IDENTIFIER.value, REQ);
            expect(getSubventionsSpy).toHaveBeenCalledWith(ASSOCIATION_ID);
        });

        it("should return a grant requests", async () => {
            const subventions = [{}] as DemandeSubvention[];
            const flux = new Flux({ subventions });

            // @ts-expect-error: mock
            getSubventionsSpy.mockImplementationOnce(() => flux);
            const expected = { subventions };
            const promise = controller.getDemandeSubventions(IDENTIFIER.value, REQ);
            flux.close();

            expect(await promise).toEqual(expected);
        });
    });

    describe("getGrants", () => {
        it("should call grantService.getGrants()", async () => {
            await controller.getGrants(IDENTIFIER.value, REQ);
            expect(grantService.getGrants).toHaveBeenCalledWith(ASSOCIATION_ID);
        });
    });

    describe("getPayments", () => {
        const getSubventionsSpy = jest.spyOn(associationsService, "getPayments");
        it("should call service with args", async () => {
            getSubventionsSpy.mockImplementationOnce(jest.fn());
            await controller.getPayments(IDENTIFIER.value, REQ);
            expect(getSubventionsSpy).toHaveBeenCalledWith(ASSOCIATION_ID);
        });

        it("should return payments", async () => {
            // @ts-expect-error: mock
            getSubventionsSpy.mockImplementationOnce(() => payments);
            const payments = [{}];
            const expected = { versements: payments };
            const actual = await controller.getPayments(IDENTIFIER.value, REQ);
            expect(actual).toEqual(expected);
        });
    });

    describe("getDocuments", () => {
        const getDocumentsSpy = jest.spyOn(associationsService, "getDocuments");
        it("should call service with args", async () => {
            getDocumentsSpy.mockImplementationOnce(jest.fn());
            await controller.getDocuments(IDENTIFIER.value, REQ);
            expect(getDocumentsSpy).toHaveBeenCalledWith(ASSOCIATION_ID);
        });

        it("should return documents", async () => {
            // @ts-expect-error: mock
            getDocumentsSpy.mockImplementationOnce(() => documents);
            const documents = [{}];
            const expected = { documents };
            const actual = await controller.getDocuments(IDENTIFIER.value, REQ);
            expect(actual).toEqual(expected);
        });

        it("should throw error", async () => {
            const ERROR_MESSAGE = "Error";
            getDocumentsSpy.mockImplementationOnce(() => Promise.reject(new Error(ERROR_MESSAGE)));
            expect(() => controller.getDocuments(IDENTIFIER.value, REQ)).rejects.toThrowError(ERROR_MESSAGE);
        });
    });

    describe("getAssociation", () => {
        const getAssociationSpy = jest.spyOn(associationsService, "getAssociation");
        it("should call service with args", async () => {
            getAssociationSpy.mockImplementationOnce(jest.fn());
            await controller.getAssociation(IDENTIFIER.value, REQ);
            expect(getAssociationSpy).toHaveBeenCalledWith(ASSOCIATION_ID);
        });

        it("should return an association", async () => {
            // @ts-expect-error: mock
            getAssociationSpy.mockImplementationOnce(() => association);
            const association = {};
            const expected = { association: association };
            const actual = await controller.getAssociation(IDENTIFIER.value, REQ);
            expect(actual).toEqual(expected);
        });

        it("should return an error message", async () => {
            const ERROR_MESSAGE = "Error";
            getAssociationSpy.mockImplementationOnce(() => Promise.reject(new Error(ERROR_MESSAGE)));
            expect(() => controller.getAssociation(IDENTIFIER.value, REQ)).rejects.toThrowError(ERROR_MESSAGE);
        });
    });

    describe("getEstablishments", () => {
        const getEtablissementSpy = jest.spyOn(associationsService, "getEstablishments");
        it("should call service with args", async () => {
            getEtablissementSpy.mockImplementationOnce(jest.fn());
            await controller.getEstablishments(IDENTIFIER.value, REQ);
            expect(getEtablissementSpy).toHaveBeenCalledWith(ASSOCIATION_ID);
        });

        it("should return establishments", async () => {
            // @ts-expect-error: mock
            getEtablissementSpy.mockImplementationOnce(() => etablissements);
            const etablissements = [{}];
            const expected = { etablissements };
            const actual = await controller.getEstablishments(IDENTIFIER.value, REQ);
            expect(actual).toEqual(expected);
        });
    });

    describe("registerExtract", () => {
        it("should return true", async () => {
            const expected = true;
            const actual = await controller.registerExtract();
            expect(actual).toEqual(expected);
        });
    });

    describe("getGrantExtract", () => {
        const CSV = "csv";
        const FILENAME = "filename";

        beforeAll(() => {
            jest.mocked(grantExtractService.buildCsv).mockResolvedValue({ csv: CSV, fileName: FILENAME });
        });

        afterAll(() => {
            jest.mocked(grantExtractService.buildCsv).mockRestore();
        });

        it("calls grantExtractService.buildCsv", async () => {
            await controller.getGrantsExtract(IDENTIFIER.value, REQ);
            expect(grantExtractService.buildCsv).toHaveBeenCalledWith(ASSOCIATION_ID);
        });

        it("stream contains csv from service", async () => {
            const expected = CSV;
            const streamRes = await controller.getGrantsExtract(IDENTIFIER.value, REQ);
            const actual = await consumers.text(streamRes);
            expect(actual).toBe(expected);
        });

        it("stream contains csv from service", async () => {
            const expected = "inline; filename=filename";
            await controller.getGrantsExtract(IDENTIFIER.value, REQ);
            // @ts-expect-error -- test private
            const actual = await controller?.headers["Content-Disposition"];
            expect(actual).toBe(expected);
        });
    });
});

describe("isAssoIdentifierFromAssoMiddleware", () => {
    const RES = "RES";
    const NEXT = jest.fn();
    const REQ = { params: { identifier: ID_STR }, assoIdentifier: ASSOCIATION_ID };
    const ERROR_HANDLER_RES = jest.fn();

    beforeAll(() => {
        jest.mocked(associationIdentifierService.getOneAssociationIdentifier).mockResolvedValue(ASSOCIATION_ID);
        jest.mocked(associationService.isIdentifierFromAsso).mockResolvedValue(true);
        jest.mocked(errorHandler).mockReturnValue(ERROR_HANDLER_RES);
    });

    afterAll(() => {
        jest.mocked(associationIdentifierService.getOneAssociationIdentifier).mockRestore();
        jest.mocked(associationService.isIdentifierFromAsso).mockRestore();
        jest.mocked(errorHandler).mockRestore();
    });

    it("gets formal id", async () => {
        await isAssoIdentifierFromAssoMiddleware({ ...REQ }, RES, NEXT);
        expect(associationIdentifierService.getOneAssociationIdentifier).toHaveBeenCalledWith(ID_STR);
    });

    it("calls service to check it is from asso", async () => {
        await isAssoIdentifierFromAssoMiddleware({ ...REQ }, RES, NEXT);
        expect(associationService.isIdentifierFromAsso).toHaveBeenCalledWith(ASSOCIATION_ID);
    });

    it("sets assoIdentifier in req", async () => {
        const REQ_TMP = { ...REQ };
        await isAssoIdentifierFromAssoMiddleware(REQ_TMP, RES, NEXT);
        expect(REQ_TMP.assoIdentifier).toMatchInlineSnapshot(`
            AssociationIdentifier {
              "rna": undefined,
              "siren": Siren {
                "siren": "000000001",
              },
            }
        `);
    });

    it("if id not from asso, calls errorHandler", async () => {
        const REQ_TMP = { ...REQ };
        jest.mocked(associationService.isIdentifierFromAsso).mockResolvedValueOnce(false);
        await isAssoIdentifierFromAssoMiddleware(REQ_TMP, RES, NEXT);
        expect(ERROR_HANDLER_RES.mock.calls?.[0]).toMatchInlineSnapshot(`
            Array [
              [Error: Votre recherche pointe vers une entité qui n'est pas une association],
              Object {
                "assoIdentifier": AssociationIdentifier {
                  "rna": undefined,
                  "siren": Siren {
                    "siren": "000000001",
                  },
                },
                "params": Object {
                  "identifier": "000000001",
                },
              },
              "RES",
              [MockFunction] {
                "calls": Array [
                  Array [],
                ],
                "results": Array [
                  Object {
                    "type": "return",
                    "value": undefined,
                  },
                ],
              },
            ]
        `);
    });

    it("if any error calls errorHandler", async () => {
        const REQ_TMP = { ...REQ };
        jest.mocked(associationIdentifierService.getOneAssociationIdentifier).mockRejectedValueOnce(new Error("haha"));
        await isAssoIdentifierFromAssoMiddleware(REQ_TMP, RES, NEXT);
        expect(ERROR_HANDLER_RES.mock.calls?.[0]).toMatchInlineSnapshot(`
            Array [
              [Error: haha],
              Object {
                "assoIdentifier": AssociationIdentifier {
                  "rna": undefined,
                  "siren": Siren {
                    "siren": "000000001",
                  },
                },
                "params": Object {
                  "identifier": "000000001",
                },
              },
              "RES",
              [MockFunction] {
                "calls": Array [
                  Array [],
                ],
                "results": Array [
                  Object {
                    "type": "return",
                    "value": undefined,
                  },
                ],
              },
            ]
        `);
    });
});

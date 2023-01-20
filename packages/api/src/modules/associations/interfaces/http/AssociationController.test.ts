import { DemandeSubvention } from "@api-subventions-asso/dto";
import Flux from "../../../../shared/Flux";
import associationsService from "../../associations.service";
import { AssociationController } from "./AssociationController";

const controller = new AssociationController();

describe("AssociationController", () => {
    const IDENTIFIER = "000000001";

    describe("getDemandeSubventions", () => {
        const getSubventionsSpy = jest.spyOn(associationsService, "getSubventions");
        it("should call service with args", async () => {
            getSubventionsSpy.mockImplementationOnce(jest.fn());
            await controller.getDemandeSubventions(IDENTIFIER);
            expect(getSubventionsSpy).toHaveBeenCalledWith(IDENTIFIER);
        });

        it("should return a grant requests", async () => {
            const subventions = [{}] as DemandeSubvention[];
            const flux = new Flux({ subventions });

            // @ts-expect-error: mock
            getSubventionsSpy.mockImplementationOnce(() => flux);
            const expected = { subventions };
            const promise = controller.getDemandeSubventions(IDENTIFIER);
            flux.close();

            expect(await promise).toEqual(expected);
        });
    });

    describe("getVersements", () => {
        const getSubventionsSpy = jest.spyOn(associationsService, "getVersements");
        it("should call service with args", async () => {
            getSubventionsSpy.mockImplementationOnce(jest.fn());
            await controller.getVersements(IDENTIFIER);
            expect(getSubventionsSpy).toHaveBeenCalledWith(IDENTIFIER);
        });

        it("should return payments", async () => {
            // @ts-expect-error: mock
            getSubventionsSpy.mockImplementationOnce(() => versements);
            const versements = [{}];
            const expected = { versements };
            const actual = await controller.getVersements(IDENTIFIER);
            expect(actual).toEqual(expected);
        });

        it("should return an error message", async () => {
            const ERROR_MESSAGE = "Error";
            getSubventionsSpy.mockImplementationOnce(() => Promise.reject(new Error(ERROR_MESSAGE)));
            const expected = { message: ERROR_MESSAGE };
            const actual = await controller.getVersements(IDENTIFIER);
            expect(actual).toEqual(expected);
        });
    });

    describe("getDocuments", () => {
        const getDocumentsSpy = jest.spyOn(associationsService, "getDocuments");
        it("should call service with args", async () => {
            getDocumentsSpy.mockImplementationOnce(jest.fn());
            await controller.getDocuments(IDENTIFIER);
            expect(getDocumentsSpy).toHaveBeenCalledWith(IDENTIFIER);
        });

        it("should return documents", async () => {
            // @ts-expect-error: mock
            getDocumentsSpy.mockImplementationOnce(() => documents);
            const documents = [{}];
            const expected = { documents };
            const actual = await controller.getDocuments(IDENTIFIER);
            expect(actual).toEqual(expected);
        });

        it("should return an error message", async () => {
            const ERROR_MESSAGE = "Error";
            getDocumentsSpy.mockImplementationOnce(() => Promise.reject(new Error(ERROR_MESSAGE)));
            const expected = { message: ERROR_MESSAGE };
            const actual = await controller.getDocuments(IDENTIFIER);
            expect(actual).toEqual(expected);
        });
    });

    describe("getAssociation", () => {
        const getAssociationSpy = jest.spyOn(associationsService, "getAssociation");
        it("should call service with args", async () => {
            getAssociationSpy.mockImplementationOnce(jest.fn());
            await controller.getAssociation(IDENTIFIER);
            expect(getAssociationSpy).toHaveBeenCalledWith(IDENTIFIER);
        });

        it("should return an association", async () => {
            // @ts-expect-error: mock
            getAssociationSpy.mockImplementationOnce(() => association);
            const association = {};
            const expected = { association: association };
            const actual = await controller.getAssociation(IDENTIFIER);
            expect(actual).toEqual(expected);
        });

        it("should return an ErrorResponse if no association found", async () => {
            // @ts-expect-error: mock
            getAssociationSpy.mockImplementationOnce(() => null);
            const expected = { message: "Association not found" };
            const actual = await controller.getAssociation(IDENTIFIER);
            expect(actual).toEqual(expected);
        });

        it("should return an error message", async () => {
            const ERROR_MESSAGE = "Error";
            getAssociationSpy.mockImplementationOnce(() => Promise.reject(new Error(ERROR_MESSAGE)));
            const expected = { message: ERROR_MESSAGE };
            const actual = await controller.getAssociation(IDENTIFIER);
            expect(actual).toEqual(expected);
        });
    });

    describe("getEtablissements", () => {
        const getEtablissementSpy = jest.spyOn(associationsService, "getEtablissements");
        it("should call service with args", async () => {
            getEtablissementSpy.mockImplementationOnce(jest.fn());
            await controller.getEtablissements(IDENTIFIER);
            expect(getEtablissementSpy).toHaveBeenCalledWith(IDENTIFIER);
        });

        it("should return establishments", async () => {
            // @ts-expect-error: mock
            getEtablissementSpy.mockImplementationOnce(() => etablissements);
            const etablissements = [{}];
            const expected = { etablissements };
            const actual = await controller.getEtablissements(IDENTIFIER);
            expect(actual).toEqual(expected);
        });

        it("should return an error message", async () => {
            const ERROR_MESSAGE = "Error";
            getEtablissementSpy.mockImplementationOnce(() => Promise.reject(new Error(ERROR_MESSAGE)));
            const expected = { message: ERROR_MESSAGE };
            const actual = await controller.getEtablissements(IDENTIFIER);
            expect(actual).toEqual(expected);
        });
    });
});

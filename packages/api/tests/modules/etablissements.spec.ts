import request from "supertest";
import { createAndGetAdminToken, createAndGetUserToken } from "../__helpers__/tokenHelper";
import etablissementService from "../../src/modules/etablissements/etablissements.service";
import statsService from "../../src/modules/stats/stats.service";
import { siretToSiren } from "../../src/shared/helpers/SirenHelper";
import associationsService from "../../src/modules/associations/associations.service";
import { BadRequestError } from "../../src/shared/errors/httpErrors";
import OsirisRequestEntityFixture from "./providers/osiris/__fixtures__/entity";
import { osirisRequestRepository } from "../../src/modules/providers/osiris/repositories";
import { versionnedUrl } from "../__helpers__/routeHelper";

const g = global as unknown as { app: unknown };

const ETABLISSEMENT_SIRET = "12345678901234";

describe("/etablissement", () => {
    const getSubventionsMock: jest.SpyInstance = jest.spyOn(etablissementService, "getSubventions");
    afterAll(() => {
        getSubventionsMock.mockRestore();
    });

    describe("/{structure_identifier}/subventions", () => {
        describe("on success", () => {
            const SUBVENTIONS = ["subventions"];
            const SUBVENTION_FLUX = [{ subventions: SUBVENTIONS }];
            beforeEach(() => {
                getSubventionsMock.mockImplementationOnce(() => ({
                    toPromise: async () => SUBVENTION_FLUX,
                }));
            });
            it("should return 200", async () => {
                const actual = (
                    await request(g.app)
                        .get(versionnedUrl(`/etablissement/${ETABLISSEMENT_SIRET}/subventions`))
                        .set("x-access-token", await createAndGetUserToken())
                        .set("Accept", "application/json")
                ).statusCode;

                expect(actual).toBe(200);
            });

            it("should return an object with subventions", async () => {
                const expected = { subventions: SUBVENTIONS };
                const actual = (
                    await request(g.app)
                        .get(versionnedUrl(`/etablissement/${ETABLISSEMENT_SIRET}/subventions`))
                        .set("x-access-token", await createAndGetUserToken())
                        .set("Accept", "application/json")
                ).body;

                expect(actual).toEqual(expected);
            });
        });
    });

    describe("/{structure_identifier}", () => {
        beforeEach(async () => {
            await osirisRequestRepository.add(OsirisRequestEntityFixture);
        });
        it("should add one visits on stats AssociationsVisit", async () => {
            const beforeRequestTime = new Date();
            const a = await request(g.app)
                .get(versionnedUrl(`/etablissement/${OsirisRequestEntityFixture.legalInformations.siret}`))
                .set("x-access-token", await createAndGetUserToken())
                .set("Accept", "application/json");

            const actual = await statsService.getTopAssociationsByPeriod(1, beforeRequestTime, new Date());
            const expected = [
                {
                    name: siretToSiren(OsirisRequestEntityFixture.legalInformations.siret),
                    visits: 1,
                },
            ];

            expect(actual).toEqual(expected);
        });

        it("should not add one visits on stats AssociationsVisit beacause user is admin", async () => {
            const beforeRequestTime = new Date();
            await request(g.app)
                .get(versionnedUrl(`/etablissement/${OsirisRequestEntityFixture.legalInformations.siret}`))
                .set("x-access-token", await createAndGetAdminToken())
                .set("Accept", "application/json");
            const actual = await statsService.getTopAssociationsByPeriod(1, beforeRequestTime, new Date());

            expect(actual).toHaveLength(0);
        });

        it("should not add one visits on stats AssociationsVisit beacause user is not authentified", async () => {
            const beforeRequestTime = new Date();
            await request(g.app)
                .get(versionnedUrl(`/etablissement/${OsirisRequestEntityFixture.legalInformations.siret}`))
                .set("Accept", "application/json");
            const actual = await statsService.getTopAssociationsByPeriod(1, beforeRequestTime, new Date());

            expect(actual).toHaveLength(0);
        });

        it("should not add one visits on stats AssociationsVisit beacause status is not 200", async () => {
            const beforeRequestTime = new Date();
            jest.spyOn(associationsService, "getAssociation").mockImplementationOnce(() => {
                throw new BadRequestError();
            });
            await request(g.app)
                .get(versionnedUrl(`/etablissement/${OsirisRequestEntityFixture.legalInformations.siret}`))
                .set("Accept", "application/json");
            const actual = await statsService.getTopAssociationsByPeriod(1, beforeRequestTime, new Date());

            expect(actual).toHaveLength(0);
        });
    });
});

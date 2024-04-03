import request from "supertest";
import { createAndGetAdminToken, createAndGetUserToken } from "../__helpers__/tokenHelper";
import osirisRequestRepository from "../../src/modules/providers/osiris/repositories/osiris.request.repository";
import fonjepSubventionRepository from "../../src/modules/providers/fonjep/repositories/fonjep.subvention.repository";
import { SubventionEntity as FonjepEntityFixture } from "./providers/fonjep/__fixtures__/entity";
import OsirisRequestEntityFixture from "./providers/osiris/__fixtures__/entity";
import dauphinService from "../../src/modules/providers/dauphin/dauphin.service";
import { compareByValueBuilder } from "../../src/shared/helpers/ArrayHelper";
import statsService from "../../src/modules/stats/stats.service";
import { siretToSiren } from "../../src/shared/helpers/SirenHelper";
import { BadRequestError } from "../../src/shared/errors/httpErrors";
import associationsService from "../../src/modules/associations/associations.service";
import { versionnedUrl } from "../__helpers__/routeHelper";

const g = global as unknown as { app: unknown };

describe("/association", () => {
    beforeEach(async () => {
        jest.spyOn(dauphinService, "getDemandeSubventionBySiren").mockImplementationOnce(async () => []);
        await osirisRequestRepository.add(OsirisRequestEntityFixture);

        await fonjepSubventionRepository.create(FonjepEntityFixture);
    });

    describe("/{structure_identifier}/subventions", () => {
        it("should return a list of subventions", async () => {
            const response = await request(g.app)
                .get(versionnedUrl(`/association/${OsirisRequestEntityFixture.legalInformations.siret}/subventions`))
                .set("x-access-token", await createAndGetUserToken())
                .set("Accept", "application/json");
            expect(response.statusCode).toBe(200);

            const subventions = response.body.subventions;
            // Sort subventions (OSIRIS first) to avoid race test failure
            subventions.sort(compareByValueBuilder("siret.provider"));

            expect(subventions).toMatchSnapshot();
        });
    });

    describe("/{structure_identifier}", () => {
        it("should return an association", async () => {
            const response = await request(g.app)
                .get(versionnedUrl(`/association/${OsirisRequestEntityFixture.legalInformations.siret}`))
                .set("x-access-token", await createAndGetUserToken())
                .set("Accept", "application/json");
            expect(response.statusCode).toBe(200);
            expect(response.body).toMatchSnapshot();
        });

        it("should add one visit on stats AssociationsVisit", async () => {
            const beforeRequestTime = new Date();
            await request(g.app)
                .get(versionnedUrl(`/association/${OsirisRequestEntityFixture.legalInformations.siret}`))
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

        it("should not add one visits on stats AssociationsVisit because user is admin", async () => {
            const beforeRequestTime = new Date();
            await request(g.app)
                .get(versionnedUrl(`/association/${OsirisRequestEntityFixture.legalInformations.siret}`))
                .set("x-access-token", await createAndGetAdminToken())
                .set("Accept", "application/json");
            const actual = await statsService.getTopAssociationsByPeriod(1, beforeRequestTime, new Date());

            expect(actual).toHaveLength(0);
        });

        it("should not add one visits on stats AssociationsVisit because user is not authenticated", async () => {
            const beforeRequestTime = new Date();
            await request(g.app)
                .get(versionnedUrl(`/association/${OsirisRequestEntityFixture.legalInformations.siret}`))
                .set("Accept", "application/json");
            const actual = await statsService.getTopAssociationsByPeriod(1, beforeRequestTime, new Date());

            expect(actual).toHaveLength(0);
        });

        it("should not add one visits on stats AssociationsVisit because status is not 200", async () => {
            const beforeRequestTime = new Date();
            jest.spyOn(associationsService, "getAssociation").mockImplementationOnce(() => {
                throw new BadRequestError();
            });
            await request(g.app)
                .get(versionnedUrl(`/association/${OsirisRequestEntityFixture.legalInformations.siret}`))
                .set("Accept", "application/json");
            const actual = await statsService.getTopAssociationsByPeriod(1, beforeRequestTime, new Date());

            expect(actual).toHaveLength(0);
        });
    });

    describe("/{structure_identifier}/etablissements", () => {
        it("should return SimplifiedEtablissement[]", async () => {
            const response = await request(g.app)
                .get(
                    versionnedUrl(
                        `/association/${siretToSiren(
                            OsirisRequestEntityFixture.legalInformations.siret,
                        )}/etablissements`,
                    ),
                )
                .set("x-access-token", await createAndGetUserToken())
                .set("Accept", "application/json");
            expect(response.statusCode).toBe(200);
            expect(response.body).toMatchSnapshot();
        });
    });
});

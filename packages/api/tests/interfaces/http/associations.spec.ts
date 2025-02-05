import { createAndGetAdminToken, createAndGetUserToken } from "../../__helpers__/tokenHelper";
import osirisRequestPort from "../../../src/dataProviders/db/providers/osiris/osiris.request.port";
import fonjepSubventionPort from "../../../src/dataProviders/db/providers/fonjep/fonjep.subvention.port.old";
import {
    SubventionEntity as FonjepSubventionFixture,
    PaymentEntity as FonjepPaymentFixture,
} from "../../modules/providers/fonjep/__fixtures__/entity";
import request from "supertest";
import OsirisRequestEntityFixture from "../../modules/providers/osiris/__fixtures__/entity";
import { compareByValueBuilder } from "../../../src/shared/helpers/ArrayHelper";
import statsService from "../../../src/modules/stats/stats.service";
import { siretToSiren } from "../../../src/shared/helpers/SirenHelper";
import { BadRequestError } from "../../../src/shared/errors/httpErrors";
import associationsService from "../../../src/modules/associations/associations.service";
import rnaSirenPort from "../../../src/dataProviders/db/rnaSiren/rnaSiren.port";
import { JoinedRawGrant, RawGrant } from "../../../src/modules/grant/@types/rawGrant";
import demarchesSimplifieesDataPort from "../../../src/dataProviders/db/providers/demarchesSimplifiees/demarchesSimplifieesData.port";
import {
    DATA_ENTITIES as DS_DATA_ENTITIES,
    SCHEMAS as DS_SCHEMAS,
} from "../../dataProviders/db/__fixtures__/demarchesSimplifiees.fixtures";
import demarchesSimplifieesMapperPort from "../../../src/dataProviders/db/providers/demarchesSimplifiees/demarchesSimplifieesMapper.port";
import demarchesSimplifieesService from "../../../src/modules/providers/demarchesSimplifiees/demarchesSimplifiees.service";

import miscScdlGrantPort from "../../../src/dataProviders/db/providers/scdl/miscScdlGrant.port";
import DEFAULT_ASSOCIATION, { LONELY_RNA } from "../../__fixtures__/association.fixture";
import dauphinGisproPort from "../../../src/dataProviders/db/providers/dauphin/dauphin-gispro.port";
import { DAUPHIN_GISPRO_DBOS } from "../../dataProviders/db/__fixtures__/dauphinGispro.fixtures";
import rnaSirenService from "../../../src/modules/rna-siren/rnaSiren.service";
import { LOCAL_AUTHORITIES, SCDL_GRANT_DBOS } from "../../dataProviders/db/__fixtures__/scdl.fixtures";
import chorusLinePort from "../../../src/dataProviders/db/providers/chorus/chorus.line.port";
import { ChorusFixtures } from "../../dataProviders/db/__fixtures__/chorus.fixtures";
import fonjepPaymentPort from "../../../src/dataProviders/db/providers/fonjep/fonjep.payment.port.old";
import FonjepSubventionEntity from "../../../src/modules/providers/fonjep/entities/FonjepSubventionEntity.old";
import Rna from "../../../src/valueObjects/Rna";
import Siret from "../../../src/valueObjects/Siret";
import { Grant } from "dto";
import miscScdlProducersPort from "../../../src/dataProviders/db/providers/scdl/miscScdlProducer.port";
import RnaSirenEntity from "../../../src/entities/RnaSirenEntity";
import Siren from "../../../src/valueObjects/Siren";

jest.mock("../../../src/modules/provider-request/providerRequest.service");

const g = global as unknown as { app: unknown };

const mockExternalData = async () => {};

const insertData = async () => {
    // data
    await rnaSirenPort.insert(
        new RnaSirenEntity(new Rna(DEFAULT_ASSOCIATION.rna), new Siren(DEFAULT_ASSOCIATION.siren)),
    );

    // PAYMENTS
    await chorusLinePort.upsertMany(ChorusFixtures);
    await fonjepPaymentPort.create(FonjepPaymentFixture);

    // APPLICATIONS
    // @ts-expect-error: DBO not fully mocked
    await dauphinGisproPort.upsert(DAUPHIN_GISPRO_DBOS[0]);
    await osirisRequestPort.add(OsirisRequestEntityFixture);
    await fonjepSubventionPort.create(FonjepSubventionFixture);
    await demarchesSimplifieesMapperPort.upsert(DS_SCHEMAS[0]);
    await demarchesSimplifieesDataPort.upsert(DS_DATA_ENTITIES[0]);
    // jest integ setup insert producers on app launch and may be defined at this point
    //@ts-expect-error: only for test
    await miscScdlProducersPort.upsert(LOCAL_AUTHORITIES[0].slug, LOCAL_AUTHORITIES[0]);
    await miscScdlGrantPort.createMany(SCDL_GRANT_DBOS);
};

describe("/association", () => {
    // SIREN must be from an association
    const SIREN = new Siret(DEFAULT_ASSOCIATION.siret).toSiren();
    const RNA = new Rna(DEFAULT_ASSOCIATION.rna);

    beforeEach(async () => {
        await insertData();
        mockExternalData();
    });

    describe("/{structure_identifier}/subventions", () => {
        it("should return a list of subventions", async () => {
            const response = await request(g.app)
                .get(`/association/${DEFAULT_ASSOCIATION.siret}/subventions`)
                .set("x-access-token", await createAndGetUserToken())
                .set("Accept", "application/json");
            expect(response.statusCode).toBe(200);

            const subventions = response.body.subventions;
            // Sort subventions (OSIRIS first) to avoid race test failure
            subventions.sort(compareByValueBuilder("siret.provider"));

            // replace date in Démarches Simplifiees
            // avoid timezone date test failure
            // use siret.provider to check on provider name by default
            subventions.forEach(subvention => {
                if (subvention.siret.provider === demarchesSimplifieesService.provider.name) {
                    subvention.date_debut.value = expect.any(Date);
                    subvention.date_fin.value = expect.any(Date);
                }
            });

            expect(subventions).toMatchSnapshot();
        });

        it("should return empty array if RNA does not match a SIREN", async () => {
            const response = await request(g.app)
                .get(`/association/${LONELY_RNA}/subventions`)
                .set("x-access-token", await createAndGetUserToken())
                .set("Accept", "application/json");
            expect(response.statusCode).toBe(200);

            const actual = response.body.subventions;
            expect(actual).toHaveLength(0);
        });
    });

    describe("/{structure_identifier}", () => {
        it("should return an association", async () => {
            const response = await request(g.app)
                .get(`/association/${OsirisRequestEntityFixture.legalInformations.siret}`)
                .set("x-access-token", await createAndGetUserToken())
                .set("Accept", "application/json");
            expect(response.statusCode).toBe(200);
            expect(response.body).toMatchSnapshot();
        });

        it("should add one visit on stats AssociationsVisit", async () => {
            const beforeRequestTime = new Date();
            await request(g.app)
                .get(`/association/${OsirisRequestEntityFixture.legalInformations.siret}`)
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
                .get(`/association/${OsirisRequestEntityFixture.legalInformations.siret}`)
                .set("x-access-token", await createAndGetAdminToken())
                .set("Accept", "application/json");
            const actual = await statsService.getTopAssociationsByPeriod(1, beforeRequestTime, new Date());

            expect(actual).toHaveLength(0);
        });

        it("should not add one visits on stats AssociationsVisit because user is not authenticated", async () => {
            const beforeRequestTime = new Date();
            await request(g.app)
                .get(`/association/${OsirisRequestEntityFixture.legalInformations.siret}`)
                .set("Accept", "application/json");
            const actual = await statsService.getTopAssociationsByPeriod(1, beforeRequestTime, new Date());

            expect(actual).toHaveLength(0);
        });

        it("should not add one visits on stats AssociationsVisit because status is not 200", async () => {
            const beforeRequestTime = new Date();
            const getAssoSpy = jest.spyOn(associationsService, "getAssociation").mockImplementationOnce(() => {
                throw new BadRequestError();
            });
            await request(g.app)
                .get(`/association/${OsirisRequestEntityFixture.legalInformations.siret}`)
                .set("Accept", "application/json");
            const actual = await statsService.getTopAssociationsByPeriod(1, beforeRequestTime, new Date());

            expect(actual).toHaveLength(0);
            getAssoSpy.mockRestore();
        });
    });

    describe("/{structure_identifier}/etablissements", () => {
        it("should return SimplifiedEtablissement[]", async () => {
            const response = await request(g.app)
                .get(`/association/${siretToSiren(OsirisRequestEntityFixture.legalInformations.siret)}/etablissements`)
                .set("x-access-token", await createAndGetUserToken())
                .set("Accept", "application/json");
            expect(response.statusCode).toBe(200);
            expect(response.body).toMatchSnapshot();
        });
    });

    describe("/{identifier}/grants", () => {
        // avoid test failure on date timezone
        function expectAnyApplicationDate(grants) {
            return grants.map(grant => {
                if (grant.application) {
                    if (grant.application.date_debut) grant.application.date_debut.value = expect.any(Date);
                    if (grant.application.date_fin) grant.application.date_fin.value = expect.any(Date);
                }
                return grant;
            });
        }

        it("should return grants with rna", async () => {
            await rnaSirenService.insert(RNA, SIREN);
            const response = await request(g.app)
                .get(`/association/${RNA}/grants`)
                .set("x-access-token", await createAndGetUserToken())
                .set("Accept", "application/json");
            expect(response.statusCode).toBe(200);

            response.body.subventions = expectAnyApplicationDate(response.body.subventions);
            expect(response.body).toMatchSnapshot();
        });

        it("should return grants with siren", async () => {
            await rnaSirenPort.insert({
                siren: SIREN,
                rna: new Rna(OsirisRequestEntityFixture.legalInformations.rna as string),
            });

            const response = await request(g.app)
                .get(`/association/${SIREN}/grants`)
                .set("x-access-token", await createAndGetUserToken())
                .set("Accept", "application/json");
            expect(response.statusCode).toBe(200);
            response.body.subventions = expectAnyApplicationDate(response.body.subventions);
            expect(response.body).toMatchSnapshot();
        });
    });

    describe("/{identifier}/raw-grants", () => {
        const anonymiseData = (data: JoinedRawGrant[] | null) => {
            if (!data) return null;
            const expectAnyRawGrantId = (rawGrant: RawGrant) => {
                // if FullGrant
                if (rawGrant.data.application && rawGrant.data.payments) {
                    return {
                        ...rawGrant,

                        // ...rawGrant.data, _id: expect.any(String) },
                        data: {
                            application: { ...rawGrant.data.application, _id: expect.any(String) },
                            payments: rawGrant.data.payments.map(payment => ({ ...payment, _id: expect.any(String) })),
                        },
                    };
                }
                // if Application or Payment
                else
                    return {
                        ...rawGrant,
                        data: { ...rawGrant.data, _id: expect.any(String) },
                    };
            };

            const withoutIdGrants = data.map(joinedRawGrant => ({
                fullGrants: joinedRawGrant.fullGrants?.map(expectAnyRawGrantId),
                applications: joinedRawGrant.applications?.map(expectAnyRawGrantId),
                payments: joinedRawGrant.payments?.map(expectAnyRawGrantId),
            }));

            return withoutIdGrants;
        };

        it("should return raw grants with siren", async () => {
            // SIREN must be from an association
            await rnaSirenPort.insert({ siren: SIREN, rna: RNA });

            const response = await request(g.app)
                .get(`/association/${SIREN}/raw-grants`)
                .set("x-access-token", await createAndGetAdminToken())
                .set("Accept", "application/json");
            expect(response.statusCode).toBe(200);
            expect(anonymiseData(response.body)).toMatchSnapshot();
        });

        it("should return raw grants with rna", async () => {
            await rnaSirenService.insert(RNA, SIREN);
            const response = await request(g.app)
                .get(`/association/${RNA}/raw-grants`)
                .set("x-access-token", await createAndGetAdminToken())
                .set("Accept", "application/json");
            expect(response.statusCode).toBe(200);
            expect(anonymiseData(response.body)).toMatchSnapshot();
        });

        it("should return empty array if identifier is RNA and no SIREN matched", async () => {
            const expected = [];
            const response = await request(g.app)
                .get(`/association/${LONELY_RNA}/raw-grants`)
                .set("x-access-token", await createAndGetAdminToken())
                .set("Accept", "application/json");
            expect(response.statusCode).toBe(200);
            const actual = response.body;
            expect(actual).toEqual(expected);
        });
    });

    describe("/{identifier}/grants/csv", () => {
        it.each`
            identifierType | identifier
            ${"siren"}     | ${SIREN}
            ${"rna"}       | ${RNA}
            ${"siret"}     | ${SIREN + "1234"}
        `("returns extract from $identifierType", async () => {
            // SIREN must be from an association
            await rnaSirenPort.insert({ siren: SIREN, rna: RNA });
            const response = await request(g.app)
                .get(`/association/${SIREN}/grants/csv`)
                .set("x-access-token", await createAndGetUserToken())
                .set("Accept", "text/csv");
            expect(response.statusCode).toBe(200);
            const actual = response.text;
            expect(actual).toMatchSnapshot();
        });
    });
});

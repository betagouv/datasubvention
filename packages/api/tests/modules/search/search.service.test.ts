import OsirisActionEntity from "../../../src/modules/providers/osiris/entities/OsirisActionEntity";
import osirisService from "../../../src/modules/providers/osiris/osiris.service";
import searchService from "../../../src/modules/search/search.service";
import OsirisRequestEntity from "../../../src/modules/providers/osiris/entities/OsirisRequestEntity";
import entrepriseApiSerivce from "../../../src/modules/external/entreprise-api.service";
import IOsirisRequestInformations from "../../../src/modules/providers/osiris/@types/IOsirisRequestInformations";
import IOsirisActionsInformations from "../../../src/modules/providers/osiris/@types/IOsirisActionsInformations";
import associationsService from "../../../src/modules/associations/associations.service";
import etablissementService from "../../../src/modules/etablissements/etablissements.service";
import ProviderValueAdapter from "../../../src/shared/adapters/ProviderValueAdapter";

describe("SearchService", () => {
    const now = new Date();
    const toPVs = (value: unknown, provider = "TEST") => ProviderValueAdapter.toProviderValues(value, provider, now);
    const toPV = (value: unknown, provider = "TEST") => ProviderValueAdapter.toProviderValue(value, provider, now);

    const spys: jest.SpyInstance<unknown>[] = [];
    beforeAll(() => {
        spys.push(
            jest.spyOn(entrepriseApiSerivce, "findRnaDataByRna"),
            jest.spyOn(entrepriseApiSerivce, "findRnaDataBySiret"),
            jest.spyOn(entrepriseApiSerivce, "findSiretDataBySiret"),
            jest.spyOn(entrepriseApiSerivce, "findAssociationBySiren"),
            jest.spyOn(associationsService, "getAssociationBySiren"),
            jest.spyOn(etablissementService, "getEtablissement"),
            jest.spyOn(osirisService, "findBySiret"),
            jest.spyOn(osirisService, "findByRna"),
        )
    });

    afterAll(() => {
        spys.forEach(spy => spy.mockReset());
    });

    describe("getBySiret", () => {

        const request = new OsirisRequestEntity({ siret: "00000000900000", rna: "RNA", name: "NAME"}, { 
            osirisId: "FAKE_ID_2",
            compteAssoId: "COMPTEASSOID",
            ej: "321165465",
            amountAwarded: 10,
            dateCommission: now,
        } as IOsirisRequestInformations, {}, undefined, []);
        const action =  new OsirisActionEntity({ osirisActionId: "OSIRISID", compteAssoId: "COMPTEASSOID"} as IOsirisActionsInformations, {}, undefined);
        beforeEach(async () => {
            await osirisService.addRequest(request);
            await osirisService.addAction(action);
        });

        it('should returns file contains actions', async () => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            etablissementService.getEtablissement.mockImplementationOnce(() => ({ siret: toPVs("00000000900000") }));

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            associationsService.getAssociationBySiren.mockImplementationOnce((siren) => ({
                siren: toPVs(siren),
                etablisements_siret: toPVs([
                    "00000000900000"
                ])
            }));

            expect(await searchService.getBySiret("00000000900000")).toMatchObject({
                siret: toPVs("00000000900000"),
                demandes_subventions: expect.arrayContaining([
                    expect.objectContaining({
                        ej: toPV("321165465", "Osiris"),
                    })
                ]),
                association: {
                    siren: toPVs("000000009"),
                    etablisements_siret: toPVs([
                        "00000000900000"
                    ])
                },
            })
        })

    });

    describe("getByRna", () => {

        const request = new OsirisRequestEntity({ siret: "00000000900000", rna: "RNA", name: "NAME"}, { 
            osirisId: "FAKE_ID_2",
            compteAssoId: "COMPTEASSOID",
            ej: "321165465",
            amountAwarded: 10,
            dateCommission: now,
        } as IOsirisRequestInformations, {}, undefined, []);
        const action =  new OsirisActionEntity({ osirisActionId: "OSIRISID", compteAssoId: "COMPTEASSOID"} as IOsirisActionsInformations, {}, undefined);
        beforeEach(async () => {
            await osirisService.addRequest(request);
            await osirisService.addAction(action);
        });

        it('should returns file contains actions', async () => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            etablissementService.getEtablissement.mockImplementationOnce(() => ({ siret: toPVs("00000000900000") }));

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            associationsService.getAssociationBySiren.mockImplementationOnce((siren) => ({
                siren: toPVs(siren),
                etablisements_siret: toPVs([
                    "00000000900000"
                ])
            }));

            expect(await searchService.getByRna("RNA")).toMatchObject({
                siren: toPVs("000000009"),
                etablisements_siret: toPVs([
                    "00000000900000"
                ]),
                etablissements: [
                    {
                        siret: toPVs("00000000900000"),
                        demandes_subventions: expect.arrayContaining([
                            expect.objectContaining({
                                ej: toPV("321165465", "Osiris"),
                            })
                        ]),
                    }
                ],
            })
        })
    });

    describe("getBySiren", () => {

        const request = new OsirisRequestEntity({ siret: "00000000900000", rna: "RNA", name: "NAME"}, { 
            osirisId: "FAKE_ID_2",
            compteAssoId: "COMPTEASSOID",
            ej: "321165465",
            amountAwarded: 10,
            dateCommission: now,
        } as IOsirisRequestInformations, {}, undefined, []);
        const action =  new OsirisActionEntity({ osirisActionId: "OSIRISID", compteAssoId: "COMPTEASSOID"} as IOsirisActionsInformations, {}, undefined);
        beforeEach(async () => {
            await osirisService.addRequest(request);
            await osirisService.addAction(action);
        });

        it('should returns file contains actions', async () => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            etablissementService.getEtablissement.mockImplementationOnce(() => ({ siret: toPVs("00000000900000") }));

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            associationsService.getAssociationBySiren.mockImplementationOnce((siren) => ({
                siren: toPVs(siren),
                etablisements_siret: toPVs([
                    "00000000900000"
                ])
            }));

            expect(await searchService.getBySiren("000000009")).toMatchObject({
                siren: toPVs("000000009"),
                etablisements_siret: toPVs([
                    "00000000900000"
                ]),
                etablissements: [
                    {
                        siret: toPVs("00000000900000"),
                        demandes_subventions: expect.arrayContaining([
                            expect.objectContaining({
                                ej: toPV("321165465", "Osiris"),
                            })
                        ]),
                    }
                ],
            })
        })
    });
});
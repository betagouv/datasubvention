import { DemarchesSimplifieesSuccessDto } from "../dto/DemarchesSimplifieesDto";
import DemarchesSimplifieesDtoAdapter from "./DemarchesSimplifieesDtoAdapter";

describe("DemarchesSimplifieesDtoAdapter", () => {
    describe("toEntities", () => {
        const SIRET = "00000000000000";
        it("should return valid entity", () => {
            const actual = DemarchesSimplifieesDtoAdapter.toEntities(
                {
                    data: {
                        demarche: {
                            dossiers: {
                                nodes: [
                                    {
                                        demandeur: {
                                            siret: SIRET,
                                        },
                                        champs: [
                                            {
                                                id: "ID",
                                                stringValue: "YO",
                                                label: "PLAI",
                                            },
                                        ],
                                        annotations: [
                                            {
                                                id: "ID",
                                                stringValue: "YO",
                                                label: "PLAI",
                                            },
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                } as unknown as DemarchesSimplifieesSuccessDto,
                12345,
            );

            expect(actual).toMatchSnapshot();
        });
    });
});

import fs from "fs";
import path from "path";

import OsirisParser from "../../../src/modules/osiris/osiris.parser";
import OsirisActionEntity from "../../../src/modules/osiris/entities/OsirisActionEntity";
import OsirisRequestEntity from "../../../src/modules/osiris/entities/OsirisRequestEntity";

describe("OsirisParser", () => {
    describe('parseRequests', () => {
        it('should return osiris requests', () => {
            const buffer = fs.readFileSync(path.resolve(__dirname, "./__fixtures__/SuiviDossiers_test.xls"));
            const requests = OsirisParser.parseRequests(buffer);

            expect(requests).toHaveLength(1);
            expect(requests[0]).toBeInstanceOf(OsirisRequestEntity);
        });

        it('should have good properties', () => {
            const buffer = fs.readFileSync(path.resolve(__dirname, "./__fixtures__/SuiviDossiers_test.xls"));
            const requests = OsirisParser.parseRequests(buffer);
            expect(requests[0]).toMatchObject({
                legalInformations: {
                    siret: 0,
                    rna: "W0000000",
                    name: "NANTES PLEINS CONTACTS"
                },
                provider: "osiris",
                providerInformations: {
                    "osirisId": "DD00-00-0000",
                    "compteAssoId": "21-000000"
                },
            });
        });
    });

    describe('parseActions', () => {
        it('should return osiris actions', () => {
            const buffer = fs.readFileSync(path.resolve(__dirname, "./__fixtures__/SuiviActions_test.xls"));
            const actions = OsirisParser.parseActions(buffer);

            expect(actions).toHaveLength(1);
            expect(actions[0]).toBeInstanceOf(OsirisActionEntity);
        });

        it('should have good properties', () => {
            const buffer = fs.readFileSync(path.resolve(__dirname, "./__fixtures__/SuiviActions_test.xls"));
            const actions = OsirisParser.parseActions(buffer);
            expect(actions[0]).toMatchObject({
                "indexedInformations": {
                    "osirisActionId": "DD44-21-0310-1",
                    "compteAssoId": "21-190698"
                },
            });
        });
    });
});
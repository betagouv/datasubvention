import request = require("supertest");
import osirisRequestRepository from "../../src/modules/providers/osiris/repositories/osiris.request.repository";
import fonjepSubventionRepository from "../../src/modules/providers/fonjep/repositories/fonjep.subvention.repository";
import { SubventionEntity as FonjepEntityFixture } from "./providers/fonjep/__fixtures__/entity";
import OsirisRequestEntityFixture from "./providers/osiris/__fixtures__/entity";
import { versionnedUrl } from "../__helpers__/routeHelper";

const g = global as unknown as { app: unknown };

describe("open-data/fournisseurs", () => {
    beforeEach(async () => {
        await osirisRequestRepository.add(OsirisRequestEntityFixture);
        await fonjepSubventionRepository.create(FonjepEntityFixture);
    });

    it("should return a list of providers with name, description and last update", async () => {
        const response = await request(g.app)
            .get(versionnedUrl("/open-data/fournisseurs"))
            .set("Accept", "application/json");
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchSnapshot();
    });
});

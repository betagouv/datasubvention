import request = require("supertest");
import { createAndGetUserToken } from "../__helpers__/tokenHelper";
import rnaSirenService from "../../src/modules/rna-siren/rnaSiren.service";
import { versionnedUrl } from "../__helpers__/routeHelper";

const g = global as unknown as { app: unknown };

describe("RnaSirenController", () => {
    const RNA = "W123456789";
    const SIREN = "123456789";

    beforeEach(() => {
        jest.spyOn(rnaSirenService, "find");
    });

    describe("GET /open-data/rna-siren/{rna}", () => {
        describe("on success", () => {
            it("should return an object", async () => {
                const expected = [{ siren: SIREN, rna: RNA }];
                (rnaSirenService.find as jest.Mock).mockResolvedValueOnce(expected);
                const actual = await request(g.app)
                    .get(versionnedUrl(`/open-data/rna-siren/${RNA}`))
                    .set("x-access-token", await createAndGetUserToken())
                    .set("Accept", "application/json");
                expect(actual.body).toEqual(expected);
            });
        });
    });

    describe("GET /open-data/rna-siren/{siren}", () => {
        describe("on success", () => {
            it("should return an object", async () => {
                const expected = [{ siren: SIREN, rna: RNA }];
                (rnaSirenService.find as jest.Mock).mockResolvedValueOnce(expected);
                const actual = (
                    await request(g.app)
                        .get(versionnedUrl(`/open-data/rna-siren/${SIREN}`))
                        .set("x-access-token", await createAndGetUserToken())
                        .set("Accept", "application/json")
                ).body;

                expect(actual).toEqual(expected);
            });
        });
    });
});

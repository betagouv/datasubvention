import request = require("supertest");
import { createAndGetAdminToken } from "../__helpers__/tokenHelper";
import { BadRequestErrorCode, BadRequestErrorMessage } from "../../src/shared/errors/httpErrors";
import { versionnedUrl } from "../__helpers__/routeHelper";

const g = global as unknown as { app: unknown };

describe("/config", () => {
    describe("email domains", () => {
        describe("GET /domains", () => {
            it("should return SuccessResponse", async () => {
                await request(g.app)
                    .get(versionnedUrl("/config/domains"))
                    .set("x-access-token", await createAndGetAdminToken())
                    .set("Accept", "application/json")
                    .expect(200, {
                        domains: [process.env.BETA_GOUV_DOMAIN],
                    });
            });
        });
        describe("POST /domains", () => {
            const VALID_DOMAIN = "@rhone.fr";
            const INVALID_DOMAIN = "@invalid.f";
            it("should return SuccessResponse", async () => {
                await request(g.app)
                    .post(versionnedUrl("/config/domains"))
                    .send({ domain: VALID_DOMAIN })
                    .set("x-access-token", await createAndGetAdminToken())
                    .set("Accept", "application/json")
                    .expect(201, { domain: VALID_DOMAIN });
            });
            it("should return BadRequestError", async () => {
                await request(g.app)
                    .post(versionnedUrl("/config/domains"))
                    .send({ domain: INVALID_DOMAIN })
                    .set("x-access-token", await createAndGetAdminToken())
                    .set("Accept", "application/json")
                    .expect(BadRequestErrorCode, {
                        message: BadRequestErrorMessage,
                    });
            });
        });
    });
});

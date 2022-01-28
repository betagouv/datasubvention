import request from "supertest"
import getUserToken from "../../../../__helpers__/getUserToken";

const g = global as unknown as { app: unknown }

describe('SearchController, /search', () => {

    describe("GET /siret/{SIRET_NUMBER}", () => {
        it("should return 200", async () => {
            const response = await request(g.app)
                .get("/search/siret/21720244900013")
                .set("x-access-token", await getUserToken())
                .set('Accept', 'application/json')
    
            expect(response.statusCode).toBe(200);
        })

        it("should return data", async () => {
            const response = await request(g.app)
                .get("/search/siret/45340784300029")
                .set("x-access-token", await getUserToken())
                .set('Accept', 'application/json')
            
            expect(response.statusCode).toBe(200);
            expect(response.body).toMatchObject({
                requests: [],
                entrepriseApi: {
                    association: { rna: null, siret: expect.any(Object) },
                    entreprise: { etablissement: expect.any(Object)  }
                }
            });
        })

        it("should return 401", async () => {
            const response = await request(g.app)
                .get("/search/siret/45340784300029")
                .set('Accept', 'application/json')

            expect(response.statusCode).toBe(401);
        })
    })

    describe("GET /rna/{RNA_NUMBER}", () => {
        it("should return 200", async () => {
            const response = await request(g.app)
                .get("/search/rna/W491002657")
                .set("x-access-token", await getUserToken())
                .set('Accept', 'application/json')
    
            expect(response.statusCode).toBe(200);
        })

        it("should return data", async () => {
            const response = await request(g.app)
                .get("/search/rna/W491002657")
                .set("x-access-token", await getUserToken())
                .set('Accept', 'application/json')
            
            expect(response.statusCode).toBe(200);
            expect(response.body).toMatchObject({
                requests: [],
                entrepriseApi: {
                    association: { rna: expect.any(Object), siret: expect.any(Object) },
                    entreprise: null
                }
            });
        })

        it("should return 401", async () => {
            const response = await request(g.app)
                .get("/search/rna/W491002657")
                .set('Accept', 'application/json')

            expect(response.statusCode).toBe(401);
        })
    })
});
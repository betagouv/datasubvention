import { AddEmailDomainDto, GetEmailDomainsDto, ErreurReponse } from "@api-subventions-asso/dto";
import { Controller, Get, Post, Route, Security, Tags, Response, Body, SuccessResponse } from "tsoa";
import configurationsService from "../../configurations.service";

@Route("/config")
@Security("jwt", ["admin"])
@Tags("Configurations Controller")
export class ConfigurationsController extends Controller {
    /**
     * @summary Ajoute un nom de domaine d'adresse e-mail
     * @param domain String nom du domaine (ex @rhone.fr ou rhone.fr)
     * @returns {AddEmailDomainDto}
     */
    @Post("/domains")
    @SuccessResponse("201", "Created")
    @Response<ErreurReponse>(500, "Internal Server Error", {
        message: "Internal Server Error"
    })
    public async addDomain(@Body() body: { domain: string }): Promise<AddEmailDomainDto> {
        const persistedDomain = await configurationsService.addEmailDomain(body.domain);
        this.setStatus(201);
        return { domain: persistedDomain };
    }

    /**
     * @summary Liste les noms de domaine authorisés
     * @returns {GetEmailDomainsDto}
     */
    @Get("/domains")
    @Response<ErreurReponse>(500, "Internal Server Error", {
        message: "Internal Server Error"
    })
    public async getDomains(): Promise<GetEmailDomainsDto> {
        const domains = await configurationsService.getEmailDomains();
        return { domains };
    }
}

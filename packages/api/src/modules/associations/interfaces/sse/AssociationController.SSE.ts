import express from "express"
import associationService from "../../associations.service";
import ControllerSSE from "../../../../decorators/controllerSSE.decorator";
import { Get } from "../../../../decorators/sse.methods.decorator";
import SSEResponse from "../../../../sse/@types/SSEResponse";

@ControllerSSE("/sse/association", {
    security: "jwt"
})
export class AssociationSSEController {

    /**
     * Recherche les demandes de subventions liées à une association
     * 
     * @summary Recherche les demandes de subventions liées à une association
     * @param identifier Identifiant Siren ou Rna
     */
    @Get("/:identifier/subventions")
    public async getDemandeSubventions(
        req: express.Request,
        res: SSEResponse,
    ) {
        const flux = await associationService.getSubventions(req.params.identifier);

        flux.onData((data) => {
            res.sendSSEData(data);
        });

        flux.onClose(() => {
            res.sendSSEData({ event: "close"});
        });
    }
}
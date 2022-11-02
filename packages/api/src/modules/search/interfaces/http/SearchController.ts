import { Route, Get, Controller, Tags, Security, Response, Deprecated } from 'tsoa';
import { Siret, Association, Etablissement, GetEtablissementResponseDto, SearchEtablissementSuccessResponseDto, GetAssociationResponseDto } from '@api-subventions-asso/dto';
import AssociationNameEntity from '../../../association-name/entities/AssociationNameEntity';

import searchService from "../../search.service";
import { AssociationIdentifiers } from '../../../../@types';
import { ErrorResponse } from "@api-subventions-asso/dto/shared/ResponseStatus";

@Route("search")
@Security("jwt")
@Tags("Search Controller")
export class SearchController extends Controller {
    /**
     * Recherche des demandes de subventions via le siret de l'établissment
     * 
     * @summary Cette route va bientôt disparaitre, ne pas l'utiliser
     * @param siret Identifiant Siret
     */
    @Deprecated()
    @Get("/etablissement/{siret}")
    @Response<SearchEtablissementSuccessResponseDto>("200")
    @Response<ErrorResponse>("404")
    public async findBySiret(
        siret: Siret,
    ): Promise<GetEtablissementResponseDto> {
        const result = await searchService.getBySiret(siret) as Etablissement;
        if (!result) {
            this.setStatus(404);
            return { success: false, message: "Etablissement not found" }
        } else {
            return { success: true, etablissement: result };
        }
    }

    /**
     * Recherche une association via son rna, siren et nom partiel ou complet
     * @summary Recherche une association via son rna, siren et nom partiel ou complet
     * @param rna_or_siren Identifiant RNA ou Identifiant Siren
     */
    @Get("/associations/{input}")
    @Response<ErrorResponse>("404", "Aucune association retrouvée", { success: false, message: "Could match any association with given input : ${input}" })
    public async findAssociations(input: string): Promise<{ success: boolean, result?: AssociationNameEntity[], message?: string }> {
        const result = await searchService.getAssociationsKeys(input);
        if (!result || (Array.isArray(result) && result.length == 0)) {
            this.setStatus(404);
            return { success: false, message: `Could match any association with given input : ${input}` }
        }
        this.setStatus(200);
        return { success: true, result };
    }
}

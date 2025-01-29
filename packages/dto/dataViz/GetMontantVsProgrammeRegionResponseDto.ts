export interface GetMontantVsProgrammeRegionSuccessResponse {
    montantVersusProgrammeRegion: {
        exerciceBudgetaire: number;
        montant: number;
        programme: string;
        regionAttachementComptable: string;
        mission: string | null;
    };
}

export type GetMontantVsProgrammeRegionResponseDto = GetMontantVsProgrammeRegionSuccessResponse;

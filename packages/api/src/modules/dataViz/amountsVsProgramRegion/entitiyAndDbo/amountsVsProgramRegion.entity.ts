type AmountsVsProgrammeRegionEntity = {
    // For the moment this concerns only chorus data

    exerciceBudgetaire: number;
    programme: string;
    mission: string | null;
    montant: number;
    // region can contain data about central administration, not only regions
    regionAttachementComptable: string;
};

export default AmountsVsProgrammeRegionEntity;

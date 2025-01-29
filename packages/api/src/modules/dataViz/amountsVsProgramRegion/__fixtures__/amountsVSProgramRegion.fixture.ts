import { ObjectId } from "mongodb";
import { AmountsVsProgrammeRegionDbo } from "../entitiyAndDbo/amountsVsProgramRegion.dbo";
import AmountsVsProgrammeRegionEntity from "../entitiyAndDbo/amountsVsProgramRegion.entity";

export const NOT_AGGREGATED_ENTITIES: AmountsVsProgrammeRegionEntity[] = [
    {
        exerciceBudgetaire: 2023,
        programme: "1 - Programme Exemple",
        mission: "Mission Exemple",
        montant: 1000,
        regionAttachementComptable: "Bretagne",
    },
    {
        exerciceBudgetaire: 2023,
        programme: "1 - Programme Exemple",
        mission: "Mission Exemple",
        montant: 7000,
        regionAttachementComptable: "Bretagne",
    },
    {
        exerciceBudgetaire: 2023,
        programme: "1",
        mission: "Mission Exemple",
        montant: 1000,
        regionAttachementComptable: "Normandie",
    },
];

export const AMOUNTS_VS_PROGRAM_REGION_ENTITIES: AmountsVsProgrammeRegionEntity[] = [
    {
        exerciceBudgetaire: 2023,
        programme: "1 - Programme Exemple",
        mission: "Mission Exemple",
        montant: 8000,
        regionAttachementComptable: "Bretagne",
    },
    {
        exerciceBudgetaire: 2023,
        programme: "1",
        mission: "Mission Exemple",
        montant: 1000,
        regionAttachementComptable: "Normandie",
    },
];

export const AMOUNTS_VS_PROGRAM_REGION_DBOS: AmountsVsProgrammeRegionDbo[] = [
    {
        _id: new ObjectId(),
        exerciceBudgetaire: 2023,
        programme: "1 - Programme Exemple",
        mission: "Mission Exemple",
        montant: 8000,
        regionAttachementComptable: "Bretagne",
    },
    {
        _id: new ObjectId(),
        exerciceBudgetaire: 2023,
        programme: "1",
        mission: "Mission Exemple",
        montant: 1000,
        regionAttachementComptable: "Normandie",
    },
];

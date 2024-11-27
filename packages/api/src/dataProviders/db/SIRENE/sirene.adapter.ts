import { ObjectId } from "mongodb";
import sireneDto from '../../api/SIRENE/sireneDto'; // Adjust the path as necessary
import sireneDbo from './sireneDbo'

export default class SireneAdapter {
    static toDbo(entity: sireneDto): sireneDbo {
        return {
            _id: new ObjectId(),
            'siren': entity.siren,
            'statutDiffusionUniteLegale': entity.statutDiffusionUniteLegale,
            'unitePurgeeUniteLegale': entity.unitePurgeeUniteLegale,
            'dateCreationUniteLegale': entity.dateCreationUniteLegale,
            'sigleUniteLegale': entity.sigleUniteLegale,
            'sexeUniteLegale': entity.sexeUniteLegale,
            'prenom1UniteLegale': entity.prenom1UniteLegale,
            'prenom2UniteLegale': entity.prenom2UniteLegale,
            'prenom3UniteLegale': entity.prenom3UniteLegale,
            'prenom4UniteLegale': entity.prenom4UniteLegale,
            'prenomUsuelUniteLegale': entity.prenomUsuelUniteLegale,
            'pseudonymeUniteLegale': entity.pseudonymeUniteLegale,
            'identifiantAssociationUniteLegale': entity.identifiantAssociationUniteLegale,
            'trancheEffectifsUniteLegale': entity.trancheEffectifsUniteLegale,
            'anneeEffectifsUniteLegale': entity.anneeEffectifsUniteLegale,
            'dateDernierTraitementUniteLegale': entity.dateDernierTraitementUniteLegale,
            'nombrePeriodesUniteLegale': entity.nombrePeriodesUniteLegale,
            'categorieEntreprise': entity.categorieEntreprise,
            'anneeCategorieEntreprise': entity.anneeCategorieEntreprise,
            'dateDebut': entity.dateDebut,
            'etatAdministratifUniteLegale': entity.etatAdministratifUniteLegale,
            'nomUniteLegale': entity.nomUniteLegale,
            'nomUsageUniteLegale': entity.nomUsageUniteLegale,
            'denominationUniteLegale': entity.denominationUniteLegale,
            'denominationUsuelle1UniteLegale': entity.denominationUsuelle1UniteLegale,
            'denominationUsuelle2UniteLegale': entity.denominationUsuelle2UniteLegale,
            'denominationUsuelle3UniteLegale': entity.denominationUsuelle3UniteLegale,
            'categorieJuridiqueUniteLegale': entity.categorieJuridiqueUniteLegale,
            'activitePrincipaleUniteLegale': entity.activitePrincipaleUniteLegale,
            'nomenclatureActivitePrincipaleUniteLegale': entity.nomenclatureActivitePrincipaleUniteLegale,
            'nicSiegeUniteLegale': entity.nicSiegeUniteLegale,
            'economieSocialeSolidaireUniteLegale': entity.economieSocialeSolidaireUniteLegale,
            'societeMissionUniteLegale': entity.societeMissionUniteLegale,
            'caractereEmployeurUniteLegale': entity.caractereEmployeurUniteLegale,
        };
            
    };
}
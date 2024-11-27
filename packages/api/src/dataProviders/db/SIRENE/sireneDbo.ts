import { ObjectId } from "mongodb";
import Siren from "../../../valueObjects/Siren";

export default interface SireneDbo {
    _id: ObjectId;
    'siren' : Siren,
    'statutDiffusionUniteLegale' : string, 
    'unitePurgeeUniteLegale' : boolean | null,
    'dateCreationUniteLegale': Date, 
    'sigleUniteLegale' : string | null,
    'sexeUniteLegale' : string | null,
    'prenom1UniteLegale' : string | null,
    'prenom2UniteLegale': string | null,
    'prenom3UniteLegale' : string | null,
    'prenom4UniteLegale'  : string | null,
    'prenomUsuelUniteLegale' : string | null,
    'pseudonymeUniteLegale' : string | null,
    'identifiantAssociationUniteLegale' : string | null,
    'trancheEffectifsUniteLegale' : string | null,
    'anneeEffectifsUniteLegale' : number | null,
    'dateDernierTraitementUniteLegale' : Date,
    'nombrePeriodesUniteLegale' : number,
    'categorieEntreprise' : string | null,
    'anneeCategorieEntreprise' : number | null,
    'dateDebut' : Date | null,
    'etatAdministratifUniteLegale' : string | null,
    'nomUniteLegale' : string | null,
    'nomUsageUniteLegale' : string | null,
    'denominationUniteLegale': string | null,
    'denominationUsuelle1UniteLegale' : string | null,
    'denominationUsuelle2UniteLegale' : string | null,
    'denominationUsuelle3UniteLegale' : string | null,
    'categorieJuridiqueUniteLegale' : string | null,
    'activitePrincipaleUniteLegale' : string | null,
    'nomenclatureActivitePrincipaleUniteLegale' : string | null,
    'nicSiegeUniteLegale' : string | null
    'economieSocialeSolidaireUniteLegale' : string | null,
    'societeMissionUniteLegale' : string | null,
    'caractereEmployeurUniteLegale' : string | null,

}
import rnaSirenPort from "../dataProviders/db/rnaSiren/rnaSiren.port";
import uniteLegalEntreprisePort from "../dataProviders/db/uniteLegalEntreprise/uniteLegalEntreprise.port";
import uniteLegalImportsPort from "../dataProviders/db/uniteLegalImports/uniteLegalImports.port";
import uniteLegalNamePort from "../dataProviders/db/uniteLegalName/uniteLegalName.port";
import sirenePort from "../dataProviders/db/SIRENE/sirene.port";
import configurationsRepository from "./configurations/repositories/configurations.repository";
import chorusLineRepository from "./providers/chorus/repositories/chorus.line.repository";
import dauphinGisproRepository from "./providers/dauphin/repositories/dauphin-gispro.repository";
import demarchesSimplifieesDataRepository from "./providers/demarchesSimplifiees/repositories/demarchesSimplifieesData.repository";
import demarchesSimplifieesMapperRepository from "./providers/demarchesSimplifiees/repositories/demarchesSimplifieesMapper.repository";
import fonjepSubventionRepository from "./providers/fonjep/repositories/fonjep.subvention.repository";
import fonjepPaymentRepository from "./providers/fonjep/repositories/fonjep.payment.repository";
import {
    osirisActionRepository,
    osirisEvaluationRepository,
    osirisRequestRepository,
} from "./providers/osiris/repositories";
import miscScdlGrantRepository from "./providers/scdl/repositories/miscScdlGrant.repository";
import miscScdlProducerRepository from "./providers/scdl/repositories/miscScdlProducer.repository";
import statsRepository from "./stats/repositories/stats.repository";
import statsAssociationsVisitRepository from "./stats/repositories/statsAssociationsVisit.repository";
import consumerTokenRepository from "./user/repositories/consumer-token.repository";
import userResetRepository from "./user/repositories/user-reset.repository";
import userRepository from "./user/repositories/user.repository";

export const repositoriesWithIndexes = [
    userRepository,
    statsRepository,
    userResetRepository,
    osirisRequestRepository,
    osirisActionRepository,
    osirisEvaluationRepository,
    fonjepPaymentRepository,
    fonjepSubventionRepository,
    dauphinGisproRepository,
    miscScdlGrantRepository,
    miscScdlProducerRepository,
    configurationsRepository,
    consumerTokenRepository,
    chorusLineRepository,
    demarchesSimplifieesDataRepository,
    demarchesSimplifieesMapperRepository,
    statsAssociationsVisitRepository,
    rnaSirenPort,
    uniteLegalEntreprisePort,
    uniteLegalImportsPort,
    uniteLegalNamePort,
    sirenePort,
];

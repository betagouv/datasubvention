import * as Sentry from "@sentry/node";
import Brevo from "@getbrevo/brevo";
import {
    AdminTerritorialLevel,
    AgentJobTypeEnum,
    AgentTypeEnum,
    RegistrationSrcTypeEnum,
    TerritorialScopeEnum,
} from "dto";
import { NotificationDataTypes } from "../@types/NotificationDataTypes";
import { NotificationType } from "../@types/NotificationType";
import { NotifyOutPipe } from "../@types/NotifyOutPipe";
import { API_SENDINBLUE_CONTACT_LIST } from "../../../configurations/apis.conf";
import BrevoNotifyPipe from "./BrevoNotifyPipe";

const SENDIND_BLUE_CONTACT_LISTS = [Number(API_SENDINBLUE_CONTACT_LIST)];

/*
 * COMPTE_ACTIVE does not mean that the account is currently active, only that it has been through firstActivation
 * specifically, a user that had activated the account then lost they password, would have `active: false` on db
 * but COMPTE_ACTIVE: true on brevo */

export class BrevoContactNotifyPipe extends BrevoNotifyPipe implements NotifyOutPipe {
    private apiInstance: Brevo.ContactsApi;

    // TODO track errors

    constructor() {
        super();
        this.apiInstance = new Brevo.ContactsApi();
    }

    notify(type, data) {
        switch (type) {
            case NotificationType.USER_CREATED:
                return this.userCreated(data);
            case NotificationType.USER_ALREADY_EXIST:
                return this.userCreated(data); // If user exist in datasub database so we create in brevo
            case NotificationType.USER_ACTIVATED:
                return this.userActivated(data);
            case NotificationType.USER_LOGGED:
                return this.userLogged(data);
            case NotificationType.USER_DELETED:
                return this.userDeleted(data);
            case NotificationType.BATCH_USERS_DELETED:
                return this.batchUsersDeleted(data);
            case NotificationType.USER_UPDATED:
                return this.userUpdated(data);
            default:
                return Promise.resolve(false);
        }
    }

    private userCreated(data: NotificationDataTypes[NotificationType.USER_CREATED]) {
        const payload = {
            attributes: {
                DATE_INSCRIPTION: data.signupAt,
                COMPTE_ACTIVE: data.active,
                SOURCE_IMPORT: "Data.Subvention",
                LIEN_ACTIVATION: data.url,
                PRENOM: data.firstname,
                NOM: data.lastname,
                IS_AGENT_CONNECT: data.isAgentConnect,
            },
            listIds: SENDIND_BLUE_CONTACT_LISTS,
        };

        const sendCreation = () => {
            return this.apiInstance
                .createContact({
                    email: data.email,
                    ...payload,
                })
                .catch(e => {
                    Sentry.captureException(e);
                    throw e;
                });
        };

        const sendUpdate = () =>
            this.apiInstance.updateContact(data.email, payload).catch(e => {
                Sentry.captureException(e);
                throw e;
            });

        return sendCreation()
            .then(({ body }) => {
                if (body?.id) return true;
                return false;
            })
            .catch(({ response, body: wrongBody }) => {
                // The true body is contained in response.body, body of error is wrong
                if (response.body.code === "duplicate_parameter") {
                    // It's error code for { code: 'duplicate_parameter', message: 'Contact already exist' }
                    // If user exists in other list brevo throws an error so we update contact to add in good list
                    return sendUpdate()
                        .then(updateAnwser => {
                            if (!updateAnwser.response) {
                                Sentry.captureException(updateAnwser);
                                return false;
                            }
                            const status = updateAnwser.response.statusCode || 0;
                            if (status >= 200 && status < 300) return true;
                            // Theoretically, this should never happen because mistakes should happen in "catch", but the lib seems to be behaving completely madly!
                            Sentry.captureException({ response: updateAnwser.response });
                            return false;
                        })
                        .catch(e => {
                            Sentry.captureException(e);
                            return false;
                        });
                }

                Sentry.captureException({ response, body: JSON.stringify(wrongBody) }); // Don't send to sentry if error is already caught
                return false;
            });
    }

    private userActivated(data: NotificationDataTypes[NotificationType.USER_ACTIVATED]) {
        const updateContact = new Brevo.UpdateContact();
        updateContact.attributes = {
            COMPTE_ACTIVE: true,
            LIEN_ACTIVATION: "",
        };
        updateContact.listIds = SENDIND_BLUE_CONTACT_LISTS;
        return this.apiInstance
            .updateContact(data.email, updateContact)
            .then(() => true)
            .catch(error => {
                Sentry.captureException(error);
                return false;
            });
    }

    private userLogged(data: NotificationDataTypes[NotificationType.USER_LOGGED]) {
        const updateContact = new Brevo.UpdateContact();
        updateContact.attributes = { DERNIERE_CONNEXION: data.date };
        updateContact.listIds = SENDIND_BLUE_CONTACT_LISTS;
        return this.apiInstance
            .updateContact(data.email, updateContact)
            .then(() => true)
            .catch(error => {
                Sentry.captureException(error);
                return false;
            });
    }

    private userDeleted(data: NotificationDataTypes[NotificationType.USER_DELETED]) {
        return this.apiInstance
            .deleteContact(data.email)
            .then(() => true)
            .catch(error => {
                Sentry.captureException(error);
                return false;
            });
    }

    private batchUsersDeleted(data: NotificationDataTypes[NotificationType.BATCH_USERS_DELETED]) {
        const promises = data.users.map(user =>
            this.apiInstance
                .deleteContact(user.email)
                .then(() => true)
                .catch(error => {
                    Sentry.captureException(error);
                    return false;
                }),
        );
        return Promise.all(promises).then(results => results.every(Boolean));
    }

    private userUpdated(data: NotificationDataTypes[NotificationType.USER_UPDATED]) {
        // TODO: get keys from a new shared DTO
        const JOB_TYPE_LABEL_MAPPING = {
            [AgentJobTypeEnum.ADMINISTRATOR]: "Gestionnaire administratif et financier",
            [AgentJobTypeEnum.EXPERT]: "Chargé de mission / Expert métier",
            [AgentJobTypeEnum.SERVICE_HEAD]: "Responsable de service",
            [AgentJobTypeEnum.CONTROLLER]: "Contrôleur / Inspecteur",
            [AgentJobTypeEnum.OTHER]: "Autre",
        };

        // TODO: get keys from a new shared DTO
        const AGENT_TYPE_LABEL_MAPPING = {
            [AgentTypeEnum.OPERATOR]: "Agent public d’un opérateur de l’État",
            [AgentTypeEnum.CENTRAL_ADMIN]: "Agent public d’une administration centrale (État)",
            [AgentTypeEnum.TERRITORIAL_COLLECTIVITY]: "Agent public d’une collectivité territoriale",
            [AgentTypeEnum.DECONCENTRATED_ADMIN]: "Agent public d’une administration déconcentrée (État)",
        };

        const ADMIN_TERRITORIAL_LEVEL_LABEL_MAPPING = {
            [AdminTerritorialLevel.DEPARTMENTAL]: "Départemental",
            [AdminTerritorialLevel.INTERDEPARTMENTAL]: "Interdépartemental",
            [AdminTerritorialLevel.REGIONAL]: "Régional",
            [AdminTerritorialLevel.INTERREGIONAL]: "Interrégional",
            [AdminTerritorialLevel.OVERSEAS]: "Collectivité d'outre-mer à statut particulier",
        };

        const TERRITORIAL_SCOPE_LABEL_MAPPING = {
            [TerritorialScopeEnum.REGIONAL]: "Régional",
            [TerritorialScopeEnum.DEPARTMENTAL]: "Départemental",
            [TerritorialScopeEnum.INTERCOMMUNAL]: "Intercommunal (EPCI)",
            [TerritorialScopeEnum.COMMUNAL]: "Communal",
            [TerritorialScopeEnum.OTHER]: "Autre",
        };

        const REGISTRATION_SRC_LABEL_MAPPING = {
            [RegistrationSrcTypeEnum.DEMO]: "Présentation Data.Subvention",
            [RegistrationSrcTypeEnum.SEARCH_ENGINE]: "Recherches sur internet",
            [RegistrationSrcTypeEnum.COLLEAGUES_HIERARCHY]: "Collègues ou hiérarchie",
            [RegistrationSrcTypeEnum.SOCIALS]: "Publication sur les réseaux sociaux",
            [RegistrationSrcTypeEnum.OTHER]: "Autre",
        };

        const ATTRIBUTES_MAPPING = {
            agentType: "CATEGORIE",
            service: "SERVICE",
            phoneNumber: "TELEPHONE",
            jobType: "BUYER_PERSONNAE",
            structure: "STRUCTURE",
            decentralizedLevel: "COMPETENCE_TERRITORIALE",
            decentralizedTerritory: "ECHELON_TERRITORIAL",
            territorialScope: "ECHELON_COLLECTIVITE",
            lastName: "NOM",
            firstName: "PRENOM",
            lastActivityDate: "DERNIERE_CONNEXION",
            region: "REGION",
            registrationSrc: "PROVENANCE",
            registrationSrcEmail: "PROVENANCE_EMAIL",
            registrationSrcDetails: "PROVENANCE_AUTRE",
        };

        function buildAttributesObject(data) {
            return Object.keys(data).reduce((acc, key) => {
                switch (key) {
                    case "agentType":
                        acc[ATTRIBUTES_MAPPING[key]] = AGENT_TYPE_LABEL_MAPPING[data[key]];
                        break;
                    case "jobType":
                        acc[ATTRIBUTES_MAPPING[key]] = (data[key] || [])
                            .map(job => JOB_TYPE_LABEL_MAPPING[job])
                            .join(",");
                        break;
                    case "decentralizedLevel":
                        acc[ATTRIBUTES_MAPPING[key]] = ADMIN_TERRITORIAL_LEVEL_LABEL_MAPPING[data[key]];
                        break;
                    case "territorialScope":
                        acc[ATTRIBUTES_MAPPING[key]] = TERRITORIAL_SCOPE_LABEL_MAPPING[data[key]];
                        break;
                    case "registrationSrc":
                        acc[ATTRIBUTES_MAPPING[key]] = (data[key] || [])
                            .map(registrationSrc => REGISTRATION_SRC_LABEL_MAPPING[registrationSrc])
                            .join(",");
                        break;
                    default:
                        if (Object.keys(ATTRIBUTES_MAPPING).includes(key)) acc[ATTRIBUTES_MAPPING[key]] = data[key];
                }

                if (typeof acc[ATTRIBUTES_MAPPING[key]] == "string" && !acc[ATTRIBUTES_MAPPING[key]].length) {
                    delete acc[ATTRIBUTES_MAPPING[key]];
                }
                return acc;
            }, {});
        }

        const updateContact = new Brevo.UpdateContact();
        const attributes: Record<string, string | boolean> = buildAttributesObject(data);
        attributes.COMPTE_ACTIVE = true;
        updateContact.attributes = attributes;
        updateContact.listIds = SENDIND_BLUE_CONTACT_LISTS;
        return this.apiInstance
            .updateContact(data.email, updateContact)
            .then(() => true)
            .catch(error => {
                Sentry.captureException(error);
                console.error("error updating contact", { email: data.email, error: error.response._body });
                return false;
            });
    }
}

const brevoContactNotifyPipe = new BrevoContactNotifyPipe();

export default brevoContactNotifyPipe;

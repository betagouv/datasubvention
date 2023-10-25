import { AdminTerritorialLevel, AgentJobTypeEnum, AgentTypeEnum, TerritorialScopeEnum } from "dto";
import { API_SENDINBLUE_CONTACT_LIST } from "../../../configurations/apis.conf";
import { NotificationType } from "../@types/NotificationType";
import BrevoContactNotifyPipe from "./BrevoContactNotifyPipe";

describe("BrevoContactNotifyPipe", () => {
    const USER_EMAIL = "user@beta.gouv.fr";

    // @ts-expect-error apiInstance is private attribute
    const mockUpdateContact = jest.spyOn(BrevoContactNotifyPipe.apiInstance, "updateContact");

    beforeAll(() => {
        mockUpdateContact.mockResolvedValue({ body: { id: 1 } } as any);
    });

    describe("notify", () => {
        let userCreatedSpy: jest.SpyInstance;

        beforeAll(() => {
            // @ts-expect-error userCreated is private methode
            userCreatedSpy = jest.spyOn(BrevoContactNotifyPipe, "userCreated").mockResolvedValue(true);
        });

        afterAll(() => {
            userCreatedSpy.mockRestore();
        });

        it("should call userCreated", () => {
            BrevoContactNotifyPipe.notify(NotificationType.USER_CREATED, {});

            expect(userCreatedSpy).toBeCalled();
        });

        it("should not call userCreated", () => {
            BrevoContactNotifyPipe.notify(NotificationType.TEST_EMAIL, {});

            expect(userCreatedSpy).not.toBeCalled();
        });
    });

    describe("userCreated", () => {
        let createContactSpy: jest.SpyInstance;

        beforeAll(() => {
            createContactSpy = jest
                // @ts-expect-error apiInstance is private attribute
                .spyOn(BrevoContactNotifyPipe.apiInstance, "createContact")
                .mockResolvedValue({ body: { id: 1 } } as any);
        });

        afterAll(() => {
            createContactSpy.mockRestore();
        });

        it("should call create data", async () => {
            const expected = {
                email: USER_EMAIL,
                attributes: {
                    DATE_INSCRIPTION: new Date(),
                    COMPTE_ACTIVE: true,
                    SOURCE_IMPORT: "Data.Subvention",
                    LIEN_ACTIVATION: "TOKEN",
                },
                listIds: [Number(API_SENDINBLUE_CONTACT_LIST)],
            };

            // @ts-expect-error userCreated is private method
            await BrevoContactNotifyPipe.userCreated({
                email: expected.email,
                signupAt: expected.attributes.DATE_INSCRIPTION,
                active: expected.attributes.COMPTE_ACTIVE,
                url: expected.attributes.LIEN_ACTIVATION,
            });

            expect(createContactSpy).toHaveBeenCalledWith(expected);
        });
    });

    describe("userActivated", () => {
        afterEach(() => {
            mockUpdateContact.mockClear();
        });

        it("call updateContact()", async () => {
            // @ts-expect-error userCreated is private method
            await BrevoContactNotifyPipe.userActivated({ email: USER_EMAIL });
            expect(mockUpdateContact).toHaveBeenCalledWith(USER_EMAIL, {
                attributes: { COMPTE_ACTIVE: true },
                listIds: [Number(API_SENDINBLUE_CONTACT_LIST)],
            });
        });
    });

    describe("userLogged", () => {
        afterEach(() => {
            mockUpdateContact.mockClear();
        });

        it("should call updateContact()", async () => {
            const email = "UserEmail";
            const now = new Date();

            // @ts-expect-error userLogged is private method
            await BrevoContactNotifyPipe.userLogged({ email, date: now });

            expect(mockUpdateContact).toHaveBeenCalledWith(email, {
                attributes: { DERNIERE_CONNEXION: now },
                listIds: [Number(API_SENDINBLUE_CONTACT_LIST)],
            });
        });
    });

    describe("userUpdated", () => {
        const UPDATE_PAYLOAD = {
            agentType: AgentTypeEnum.TERRITORIAL_COLLECTIVITY,
            service: "SERVICE",
            phoneNumber: "+33625859685",
            jobType: [AgentJobTypeEnum.ADMINISTRATOR, AgentJobTypeEnum.EXPERT],
            centralStructure: "ADMIN_CENTRALE",
            decentralizedLevel: AdminTerritorialLevel.INTERDEPARTMENTAL,
            decentralizedTerritory: "ECHELON_TERRITORIAL",
            decentralizedStructure: "SERVICE_DECONCENTRE",
            operatorStructure: "OPERATEUR",
            territorialStructure: "COLLECTIVITES",
            territorialScope: TerritorialScopeEnum.DEPARTMENTAL,
            lastName: "NOM",
            firstName: "PRENOM",
        };

        it("should call updateContact()", async () => {
            //@ts-expect-error: private method
            await BrevoContactNotifyPipe.userUpdated({ email: "test@datasubvention.gouv.fr", ...UPDATE_PAYLOAD });
            expect(mockUpdateContact.mock.calls[0]).toMatchSnapshot();
        });
    });
});

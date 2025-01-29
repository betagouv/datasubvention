import { AgentTypeEnum, RegistrationSrcTypeEnum } from "dto";
import type { MockInstance } from "vitest";
import { beforeEach } from "vitest";
import type { SpyInstance } from "vitest";
import StructureFormStepController from "./StructureFormStep.controller";
import Dispatch from "$lib/core/Dispatch";
import { isPhoneNumber } from "$lib/helpers/stringHelper";

vi.mock("$lib/core/Dispatch", () => ({
    default: {
        getDispatcher: vi.fn(() => vi.fn()),
    },
}));
vi.mock("$lib/helpers/stringHelper");

describe("StructureFormStepController", () => {
    let ctrl: StructureFormStepController;

    beforeEach(() => {
        ctrl = new StructureFormStepController();
    });

    describe("constructor", () => {
        it("inits dispatch", () => {
            const expected = vi.fn();
            vi.mocked(Dispatch.getDispatcher).mockReturnValueOnce(expected);
            ctrl = new StructureFormStepController();
            // @ts-expect-error - mock private
            const actual = ctrl.dispatch;
            expect(actual).toBe(expected);
        });

        it.each`
            varName
            ${"jobTypeOptions"}
            ${"dirty"}
        `("inits $varName", ({ varName }) => {
            // @ts-expect-error - mock
            expect(ctrl[varName]).toMatchSnapshot();
        });

        describe("validators", () => {
            it.skip.each`
                varName          | emptyValue
                ${"service"}     | ${""}
                ${"jobType"}     | ${[]}
                ${"phoneNumber"} | ${""}
            `("empty $varName returns error", ({ varName, emptyValue }) => {
                const expected = "Ce champ est obligatoire";
                // @ts-expect-error - mock private
                const actual = ctrl.validators[varName](emptyValue);
                expect(actual).toBe(expected);
            });

            it("returns error message if return from helper is false", () => {
                vi.mocked(isPhoneNumber).mockReturnValueOnce(false);
                // @ts-expect-error - mock private
                const actual = ctrl.validators.phoneNumber("not a phone number");
                expect(actual).toMatchInlineSnapshot('"Entrez un numéro de téléphone valide"');
            });

            it("returns undefined if return from helper is true", () => {
                vi.mocked(isPhoneNumber).mockReturnValueOnce(true);
                // @ts-expect-error - mock private
                const actual = ctrl.validators.phoneNumber("a phone number");
                expect(actual).toBeUndefined();
            });

            it.skip.each`
                varName      | correctValue
                ${"service"} | ${"something"}
                ${"jobType"} | ${["some1"]}
            `("filled $varName returns undefined", ({ varName, correctValue }) => {
                // @ts-expect-error - test private
                const actual = ctrl.validators[varName](correctValue);
                expect(actual).toBeUndefined();
            });
        });
    });

    describe("onUpdate", () => {
        it("updates dirty", () => {
            const KEY = "someKey";
            ctrl.onUpdate({}, KEY);
            const expected = true;
            // @ts-expect-error - test private
            const actual = ctrl.dirty[KEY];
            expect(actual).toBe(expected);
        });

        it("validates all fields", () => {
            const mocks = {
                field1: vi.fn(),
                field2: vi.fn(),
                field3: vi.fn(),
            };
            const values: { [key: string]: string } = {
                field1: "value1",
                field3: "value3",
            };
            // @ts-expect-error - mock private
            ctrl.validators = { ...mocks };

            ctrl.onUpdate(values, "field1");
            for (const [fieldName, validator] of Object.entries(mocks))
                expect(validator).toHaveBeenCalledWith(values[fieldName]);
        });

        it("updates errors store about dirty invalid fields", () => {
            const mocks = {
                field1: vi.fn(),
                field2: vi.fn((..._args) => "some error"),
                field3: vi.fn((..._args) => "some error"),
            };
            // @ts-expect-error - mock private
            ctrl.validators = { ...mocks };
            // @ts-expect-error - mock private
            ctrl.dirty = {
                field2: true,
            };
            const errorSetSpy = vi.spyOn(ctrl.errors, "set");

            ctrl.onUpdate({}, "someField");
            expect(errorSetSpy).toHaveBeenCalledWith({ field2: "some error" });
        });

        it.each`
            isDirty  | isValid  | expectedEvent
            ${true}  | ${false} | ${"error"}
            ${false} | ${false} | ${"error"}
            ${true}  | ${true}  | ${"valid"}
            ${false} | ${true}  | ${"valid"}
        `("dispatches error if dirty field is invalid", ({ isDirty, isValid, expectedEvent }) => {
            const mocks = {
                field: vi.fn((..._args) => (isValid ? undefined : "some error")),
            };
            // @ts-expect-error - mock private
            ctrl.validators = { ...mocks };
            // @ts-expect-error - mock private
            ctrl.dirty = {
                field: isDirty,
            };
            // @ts-expect-error - mock private
            const dispatchSpy = vi.spyOn(ctrl, "dispatch");

            ctrl.onUpdate({}, "someField");
            expect(dispatchSpy).toHaveBeenCalledWith(expectedEvent);
        });
    });

    describe("onUpdateContext", () => {
        const CONTEXT = { agentType: AgentTypeEnum.OPERATOR };
        const values = { field: "value" };
        let cleanerSpy: MockInstance;

        beforeEach(() => {
            // @ts-expect-error mock
            cleanerSpy = vi.spyOn(ctrl, "cleanSubStepValues").mockImplementation(vi.fn());
            // @ts-expect-error private
            ctrl.currentAgentType = AgentTypeEnum.OPERATOR;
        });

        it("does nothing if no change of context agentType", () => {
            // @ts-expect-error mock
            const substepSetSpy = vi.spyOn(ctrl.subStep, "set").mockImplementation(vi.fn());
            ctrl.onUpdateContext(CONTEXT, values);
            expect(cleanerSpy).not.toHaveBeenCalled();
            expect(substepSetSpy).not.toHaveBeenCalled();
        });

        it("updates currentAgentType", () => {
            // @ts-expect-error private
            ctrl.currentAgentType = AgentTypeEnum.CENTRAL_ADMIN;
            const expected = AgentTypeEnum.OPERATOR;
            ctrl.onUpdateContext(CONTEXT, values);
            // @ts-expect-error private
            const actual = ctrl.currentAgentType;
            expect(actual).toBe(expected);
        });

        it("calls cleanSubStepValues", () => {
            // @ts-expect-error private
            ctrl.currentAgentType = AgentTypeEnum.CENTRAL_ADMIN;
            ctrl.onUpdateContext(CONTEXT, values);
            expect(cleanerSpy).toHaveBeenCalledWith(values, AgentTypeEnum.OPERATOR);
        });
    });

    describe("cleanSubStepValues", () => {
        let values: Record<string, any>;

        beforeEach(() => {
            values = {
                operatorSomething: "something",
                centralSomething: "something else",
                structure: "old value",
            };
        });

        it("structure is set to empty string", () => {
            const expected = "";
            ctrl.cleanSubStepValues(values, AgentTypeEnum.OPERATOR);
            const actual = values.structure;
            expect(actual).toBe(expected);
        });

        it("remove values from other substeps", () => {
            ctrl.cleanSubStepValues(values, AgentTypeEnum.OPERATOR);
            expect(values.centralSomething).toBeUndefined();
        });
    });

    describe("onUpdateRegistrationSrc", () => {
        let mockUpdate: SpyInstance;
        beforeEach(() => {
            mockUpdate = vi.spyOn(StructureFormStepController.prototype, "onUpdate").mockImplementation(vi.fn());
        });

        afterAll(() => {
            mockUpdate.mockRestore();
        });

        it("registrationSrcEmail and registrationSrcDetails are set to empty strings", () => {
            const values = {
                registrationSrc: [RegistrationSrcTypeEnum.DEMO],
                registrationSrcEmail: "test@email.com",
                registrationSrcDetails: "Other",
            };
            const expected = {
                registrationSrc: [RegistrationSrcTypeEnum.DEMO],
                registrationSrcEmail: "",
                registrationSrcDetails: "",
            };
            ctrl.onUpdateRegistrationSrc(values);
            expect(values).toStrictEqual(expected);
        });
        it("registrationSrcEmail and registrationSrcDetails are not set to empty strings", () => {
            const values = {
                registrationSrc: [RegistrationSrcTypeEnum.COLLEAGUES_HIERARCHY, RegistrationSrcTypeEnum.OTHER],
                registrationSrcEmail: "test@email.com",
                registrationSrcDetails: "Other",
            };
            const expected = { ...values };
            ctrl.onUpdateRegistrationSrc(values);
            expect(values).toStrictEqual(expected);
        });
    });

    describe("isRegistrationSrcEmailVisible", () => {
        it("is visible", () => {
            const registerSrcValue = [RegistrationSrcTypeEnum.SOCIALS, RegistrationSrcTypeEnum.COLLEAGUES_HIERARCHY];
            const expected = true;
            const isVisible = ctrl.isRegistrationSrcEmailVisible(registerSrcValue);
            expect(isVisible).toStrictEqual(expected);
        });
        it("is not visible", () => {
            const registerSrcValue = [RegistrationSrcTypeEnum.SOCIALS, RegistrationSrcTypeEnum.OTHER];
            const expected = false;
            const isVisible = ctrl.isRegistrationSrcEmailVisible(registerSrcValue);
            expect(isVisible).toStrictEqual(expected);
        });
    });

    describe("isRegistrationSrcDetailsVisible", () => {
        it("is visible", () => {
            const registerSrcValue = [RegistrationSrcTypeEnum.SOCIALS, RegistrationSrcTypeEnum.OTHER];
            const expected = true;
            const isVisible = ctrl.isRegistrationSrcDetailsVisible(registerSrcValue);
            expect(isVisible).toStrictEqual(expected);
        });
        it("is not visible", () => {
            const registerSrcValue = [RegistrationSrcTypeEnum.SOCIALS, RegistrationSrcTypeEnum.COLLEAGUES_HIERARCHY];
            const expected = false;
            const isVisible = ctrl.isRegistrationSrcDetailsVisible(registerSrcValue);
            expect(isVisible).toStrictEqual(expected);
        });
    });
});

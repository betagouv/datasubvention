import { AgentTypeEnum, AgentJobTypeEnum, RegistrationSrcTypeEnum } from "dto";
import type { ComponentType, SvelteComponent } from "svelte";
import OperatorSubStep from "./OperatorSubStep/OperatorSubStep.svelte";
import CentralSubStep from "./CentralSubStep/CentralSubStep.svelte";
import TerritorialCollectivitySubStep from "./TerritorialCollectivitySubStep/TerritorialCollectivitySubStep.svelte";
import DecentralizedSubStep from "./DecentralizedSubStep/DecentralizedSubStep.svelte";
import Dispatch from "$lib/core/Dispatch";
import Store from "$lib/core/Store";
import { isPhoneNumber } from "$lib/helpers/stringHelper";
import type { Option } from "$lib/types/FieldOption";

interface Context {
    agentType: AgentTypeEnum;
}

interface SubStep {
    component: typeof SvelteComponent;
    // valid: boolean
}

export default class StructureFormStepController {
    private readonly dispatch: (_: string) => void;

    public readonly errors: Store<{ [key: string]: string | undefined }>;
    // private static errorMandatory = "Ce champ est obligatoire";
    private readonly dirty: { [key: string]: boolean };

    private readonly validators: Record<string, (value: any) => string | undefined> = {
        // service: (text: string) => {
        //     if (!text) return StructureFormStepController.errorMandatory;
        // },
        // jobType: (jobs: string[] | null) => {
        //     if (!jobs?.length) return StructureFormStepController.errorMandatory;
        // },
        phoneNumber: (number: string) => {
            // if (!number) return StructureFormStepController.errorMandatory;
            if (number && !isPhoneNumber(number)) return "Entrez un numéro de téléphone valide";
        },
    };

    public readonly jobTypeOptions: Option<AgentJobTypeEnum>[] = [
        { value: AgentJobTypeEnum.ADMINISTRATOR, label: "Gestionnaire administratif et financier" },
        {
            value: AgentJobTypeEnum.EXPERT,
            label: "Chargé de mission / Expert métier",
        },
        { value: AgentJobTypeEnum.SERVICE_HEAD, label: "Responsable de service" },
        { value: AgentJobTypeEnum.CONTROLLER, label: "Contrôleur / Inspecteur" },
        { value: AgentJobTypeEnum.OTHER, label: "Autre" },
    ];
    public readonly registrationSrcOptions: Option<RegistrationSrcTypeEnum>[] = [
        { value: RegistrationSrcTypeEnum.DEMO, label: "Lors d’une présentation avec une personne de Data.Subvention" },
        { value: RegistrationSrcTypeEnum.SEARCH_ENGINE, label: "Via des recherches sur internet" },
        {
            value: RegistrationSrcTypeEnum.COLLEAGUES_HIERARCHY,
            label: "Un de mes collègues ou de ma hiérarchie m’en a parlé",
        },
        { value: RegistrationSrcTypeEnum.SOCIALS, label: "Via une publication sur les réseaux sociaux" },
        { value: RegistrationSrcTypeEnum.OTHER, label: "Autre" },
    ];

    private static subStepByAgentType: Record<AgentTypeEnum, ComponentType> = {
        [AgentTypeEnum.CENTRAL_ADMIN]: CentralSubStep,
        [AgentTypeEnum.OPERATOR]: OperatorSubStep,
        [AgentTypeEnum.TERRITORIAL_COLLECTIVITY]: TerritorialCollectivitySubStep,
        [AgentTypeEnum.DECONCENTRATED_ADMIN]: DecentralizedSubStep,
    };

    private static subFieldsPrefixByAgentType = {
        [AgentTypeEnum.CENTRAL_ADMIN]: "central",
        [AgentTypeEnum.OPERATOR]: "operator",
        [AgentTypeEnum.TERRITORIAL_COLLECTIVITY]: "territorial",
        [AgentTypeEnum.DECONCENTRATED_ADMIN]: "decentralized",
    };

    public subStep: Store<SubStep | undefined>;
    public subStepValues: Store<Record<AgentTypeEnum, Record<string, string | undefined>>>;
    private currentAgentType: AgentTypeEnum | undefined;

    constructor() {
        this.dispatch = Dispatch.getDispatcher();
        this.subStep = new Store(undefined);
        this.subStepValues = new Store({
            [AgentTypeEnum.CENTRAL_ADMIN]: {},
            [AgentTypeEnum.OPERATOR]: {},
            [AgentTypeEnum.TERRITORIAL_COLLECTIVITY]: {},
            [AgentTypeEnum.DECONCENTRATED_ADMIN]: {},
        });

        this.errors = new Store({});
        this.dirty = {};
        for (const inputName of Object.keys(this.validators)) {
            this.dirty[inputName] = false;
        }
        this.dispatch("valid"); // no required field so default is valid
    }

    onUpdate(values: Record<string, unknown>, changedKey: string) {
        this.dirty[changedKey] = true;
        const tempErrors: { [key: string]: string | undefined } = {};
        let currentError;
        let shouldBlockStep = false;
        // a step should sometimes be blocked even if we display no error to the user,
        // typically when a required field was not filled at all
        for (const [key, validator] of Object.entries(this.validators)) {
            currentError = validator(values[key] as string);
            if (currentError) shouldBlockStep = true;
            if (this.dirty[key]) tempErrors[key] = currentError;
        }
        this.errors.set(tempErrors);
        this.dispatch("change");
        this.dispatch(shouldBlockStep ? "error" : "valid");
    }

    onUpdateRegistrationSrc(values: Record<string, unknown>) {
        //Set registrationSrcEmail & registrationSrcDetails to empty, to avoid saving unused data
        this.onUpdate(values, "registrationSrc");
        if (values["registrationSrc"] && Array.isArray(values["registrationSrc"])) {
            if (
                !values["registrationSrc"].includes(RegistrationSrcTypeEnum.COLLEAGUES_HIERARCHY) &&
                values["registrationSrcEmail"] !== ""
            ) {
                values["registrationSrcEmail"] = "";
                this.onUpdate(values, "registrationSrcEmail");
            }
            if (
                !values["registrationSrc"].includes(RegistrationSrcTypeEnum.OTHER) &&
                values["registrationSrcDetails"] !== ""
            ) {
                values["registrationSrcDetails"] = "";
                this.onUpdate(values, "registrationSrcDetails");
            }
        }
    }

    cleanSubStepValues(values: Record<string, any>, contextAgentType: AgentTypeEnum) {
        const prefixes: string[] = [];
        for (const [agentType, prefix] of Object.entries(StructureFormStepController.subFieldsPrefixByAgentType)) {
            if (agentType === contextAgentType) continue;
            prefixes.push(prefix);
        }
        const regex = new RegExp(`^(${prefixes.join("|")})`);

        for (const key of Object.keys(values)) {
            if (regex.test(key)) delete values[key];
        }
        values["structure"] = "";
    }

    onUpdateContext(context: Context, values: Record<string, any>) {
        if (context.agentType === this.currentAgentType) return;
        if (this.currentAgentType) this.cleanSubStepValues(values, context.agentType);
        this.currentAgentType = context.agentType;
        const component = StructureFormStepController.subStepByAgentType[context.agentType];
        this.subStep.set(
            component
                ? {
                      component,
                      // valid: false
                  }
                : undefined,
        );
    }

    isRegistrationSrcEmailVisible(registerSrcValue: RegistrationSrcTypeEnum[]) {
        return registerSrcValue && registerSrcValue.includes(RegistrationSrcTypeEnum.COLLEAGUES_HIERARCHY);
    }

    isRegistrationSrcDetailsVisible(registerSrcValue: RegistrationSrcTypeEnum[]) {
        return registerSrcValue && registerSrcValue.includes(RegistrationSrcTypeEnum.OTHER);
    }
}

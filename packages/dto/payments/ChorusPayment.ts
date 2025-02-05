import { ProviderValue } from "../shared/ProviderValue";
import { BasePayment } from "./BasePayment";

export interface ChorusPayment extends BasePayment {
    ej: ProviderValue<string>;
    centreFinancier?: ProviderValue<string>;
    domaineFonctionnel?: ProviderValue<string>;
    numeroDemandePaiement?: ProviderValue<string>;
    numeroTier?: ProviderValue<string>;
    activitee?: ProviderValue<string>;
    compte?: ProviderValue<string>;
    codeBranche?: ProviderValue<string>;
    branche?: ProviderValue<string>;
    type?: ProviderValue<string>;
    /**
     * Deprecated
     */
    bop?: ProviderValue<string>;
}

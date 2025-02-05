import { ProviderValue } from "../shared/ProviderValue";
import { SiretDto } from "../shared/Siret";

export interface BasePayment {
    versementKey: ProviderValue<string>;
    siret: ProviderValue<SiretDto>;
    amount: ProviderValue<number>;
    dateOperation: ProviderValue<Date>;
    programme: ProviderValue<number>;
    libelleProgramme?: ProviderValue<string>;
}

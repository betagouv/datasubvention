import dedent from "dedent";
import {
    AdminTerritorialLevel,
    AgentJobTypeEnum,
    AgentTypeEnum,
    ResetPasswordErrorCodes,
    TerritorialScopeEnum,
} from "dto";
import { isInObjectValues } from "../../../../shared/Validators";
import { BadRequestError } from "../../../../shared/errors/httpErrors";
import { joinEnum } from "../../../../shared/helpers/ArrayHelper";
import userCheckService from "../check/user.check.service";
import { UserService } from "../../user.service";

export class UserProfileService {
    validateUserProfileData(userInfo, withPassword = true): { valid: false; error: Error } | { valid: true } {
        const { password, agentType, jobType, structure } = userInfo;
        const validations = [
            {
                value: agentType,
                method: value => isInObjectValues(AgentTypeEnum, value),
                error: new BadRequestError(dedent`Mauvaise valeur pour le type d'agent.
                    Les valeurs possibles sont ${joinEnum(AgentTypeEnum)}
                `),
            },
            {
                value: jobType,
                method: jobType => {
                    if (!jobType?.length) return true;
                    return !jobType.find(type => !isInObjectValues(AgentJobTypeEnum, type));
                },
                error: new BadRequestError(dedent`Mauvaise valeur pour le type de poste.
                    Les valeurs possibles sont ${joinEnum(AgentJobTypeEnum)}
                `),
            },
            {
                value: structure,
                method: value => !value || typeof value == "string",
                error: new BadRequestError(dedent`Mauvaise valeur pour la structure.`),
            },
        ];

        if (withPassword)
            validations.push({
                value: password,
                method: userCheckService.passwordValidator,
                error: new BadRequestError(
                    UserService.PASSWORD_VALIDATOR_MESSAGE,
                    ResetPasswordErrorCodes.PASSWORD_FORMAT_INVALID,
                ),
            });

        /**
         *          AGENT TYPE SPECIFIC VALUES
         */

        if (agentType === AgentTypeEnum.TERRITORIAL_COLLECTIVITY)
            validations.push({
                value: userInfo.territorialScope,
                method: value => !value || isInObjectValues(TerritorialScopeEnum, value),
                error: new BadRequestError(dedent`Mauvaise valeur pour le périmètre
                Les valeurs possibles sont ${joinEnum(TerritorialScopeEnum)}`),
            });

        if (agentType === AgentTypeEnum.DECONCENTRATED_ADMIN)
            validations.push({
                value: userInfo.decentralizedLevel,
                method: value => !value || isInObjectValues(AdminTerritorialLevel, value),
                error: new BadRequestError(dedent`Mauvaise valeur pour le niveau territorial
                Les valeurs possibles sont ${joinEnum(AdminTerritorialLevel)}`),
            });

        let error: Error | undefined;
        for (const validation of validations) {
            if (!validation.method(validation.value)) {
                error = validation.error;
                break;
            }
        }
        return error ? { valid: false, error: error as BadRequestError } : { valid: true };
    }
}

const userProfileService = new UserProfileService();
export default userProfileService;

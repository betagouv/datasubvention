import { ObjectId } from "mongodb";
import * as RandToken from "rand-token";

import dedent from "dedent";
import {
    ResetPasswordErrorCodes,
    SignupErrorCodes,
    UserWithResetTokenDto,
    UserDto,
    FutureUserDto,
    TokenValidationDtoResponse,
    TokenValidationType,
} from "dto";
import { RoleEnum } from "../../@enums/Roles";
import { DefaultObject } from "../../@types";
import { JWT_EXPIRES_TIME } from "../../configurations/jwt.conf";
import {
    BadRequestError,
    InternalServerError,
    NotFoundError,
    UserNotFoundError,
    ResetTokenNotFoundError,
} from "../../shared/errors/httpErrors";
import { NotificationType } from "../notify/@types/NotificationType";
import notifyService from "../notify/notify.service";
import { removeSecrets } from "../../shared/helpers/RepositoryHelper";
import { FRONT_OFFICE_URL } from "../../configurations/front.conf";
import { ConsumerToken } from "./entities/ConsumerToken";
import consumerTokenRepository from "./repositories/consumer-token.repository";
import userResetRepository from "./repositories/user-reset.repository";
import UserReset from "./entities/UserReset";
import UserDbo, { UserNotPersisted } from "./repositories/dbo/UserDbo";
import userAuthService from "./services/auth/user.auth.service";
import userRepository from "./repositories/user.repository";
import { DEFAULT_PWD } from "./user.constant";
import userCheckService from "./services/check/user.check.service";
import userStatsService from "./services/stats/user.stats.service";
import userActivationService from "./services/activation/user.activation.service";

export enum UserServiceErrors {
    LOGIN_WRONG_PASSWORD_MATCH,
    LOGIN_UPDATE_JWT_FAIL,
    USER_NOT_ACTIVE,
    CREATE_INVALID_EMAIL,
    CREATE_USER_ALREADY_EXISTS,
    CREATE_USER_WRONG,
    FORMAT_PASSWORD_INVALID,
    USER_NOT_FOUND,
    ROLE_NOT_FOUND,
    RESET_TOKEN_NOT_FOUND,
    RESET_TOKEN_EXPIRED,
    CREATE_RESET_PASSWORD_WRONG,
    CREATE_EMAIL_GOUV,
    CREATE_CONSUMER_TOKEN,
    USER_TOKEN_EXPIRED,
}

export interface UserServiceError {
    message: string;
    code: number;
}

export class UserService {
    public static RESET_TIMEOUT = 1000 * 60 * 60 * 24 * 10; // 10 days in ms
    public static PASSWORD_VALIDATOR_MESSAGE = dedent`Password is too weak, please use this rules:
        At least one digit [0-9]
        At least one lowercase character [a-z]
        At least one uppercase character [A-Z]
        At least one special character [*.!@#$%^&(){}[]:;<>,.?/~_+-=|\\]
        At least 8 characters in length, but no more than 32.`;

    public static CONSUMER_TOKEN_PROP = "isConsumerToken";

    findByEmail(email: string) {
        return userRepository.findByEmail(email);
    }

    async findConsumerToken(userId: ObjectId): Promise<string> {
        const token = await consumerTokenRepository.findToken(userId);
        if (!token) {
            throw new NotFoundError("Aucun token d'authentification n'a été trouvé");
        }
        return token;
    }

    async findAnonymizedUsers(query: DefaultObject = {}) {
        const users = await this.find(query);

        return users.map(user => {
            return {
                ...user,
                _id: user._id.toString(),
                email: undefined,
                firstName: undefined,
                lastName: undefined,
                phoneNumber: undefined,
            };
        });
    }

    find(query: DefaultObject = {}) {
        return userRepository.find(query);
    }

    async createConsumer(userObject: FutureUserDto) {
        const user = await this.createUser({ ...userObject, roles: [RoleEnum.user, RoleEnum.consumer] });
        const consumerToken = userAuthService.buildJWTToken(
            { ...user, [UserService.CONSUMER_TOKEN_PROP]: true },
            { expiration: false },
        );
        try {
            await consumerTokenRepository.create(new ConsumerToken(user._id, consumerToken));
            return user;
        } catch (e) {
            await this.delete(user._id.toString());
            throw new InternalServerError("Could not create consumer token", UserServiceErrors.CREATE_CONSUMER_TOKEN);
        }
    }

    async createUser(userObject: FutureUserDto): Promise<UserDto> {
        // default values and ensures format
        if (!userObject.roles) userObject.roles = [RoleEnum.user];

        const sanitizedUser = await userCheckService.validateSanitizeUser(userObject);

        const partialUser = {
            email: userObject.email,
            signupAt: new Date(),
            roles: sanitizedUser.roles,
            firstName: sanitizedUser.firstName || null,
            lastName: sanitizedUser.lastName || null,
            profileToComplete: true,
        };

        const now = new Date();
        const jwtParams = {
            token: userAuthService.buildJWTToken(partialUser as UserDto),
            expirateDate: new Date(now.getTime() + JWT_EXPIRES_TIME),
        };

        const user = {
            ...partialUser,
            jwt: jwtParams,
            hashPassword: await userAuthService.getHashPassword(DEFAULT_PWD),
            active: false,
        } as UserNotPersisted;

        const createdUser = await userRepository.create(user);

        if (!createdUser)
            throw new InternalServerError("The user could not be created", UserServiceErrors.CREATE_USER_WRONG);

        return createdUser;
    }

    public async update(user: Partial<UserDto> & Pick<UserDto, "email">): Promise<UserDto> {
        await userCheckService.validateEmail(user.email);
        return await userRepository.update(user);
    }

    public async delete(userId: string): Promise<boolean> {
        const user = await this.getUserById(userId);

        if (!user) return false;

        if (!(await userRepository.delete(user))) return false;

        const deletePromises = [
            userResetRepository.removeAllByUserId(user._id),
            consumerTokenRepository.deleteAllByUserId(user._id),
        ];

        notifyService.notify(NotificationType.USER_DELETED, {
            email: user.email,
            firstname: user.firstName,
            lastname: user.lastName,
        });

        return (await Promise.all(deletePromises)).every(success => success);
    }

    public async signup(userObject: FutureUserDto, role = RoleEnum.user): Promise<UserDto> {
        userObject.roles = [role];

        let user;
        if (role == RoleEnum.consumer) {
            user = await this.createConsumer(userObject);
        } else {
            try {
                user = await this.createUser(userObject);
            } catch (e) {
                if (e instanceof BadRequestError && e.code === UserServiceErrors.CREATE_EMAIL_GOUV)
                    throw new BadRequestError(e.message, SignupErrorCodes.EMAIL_MUST_BE_END_GOUV);
                throw e;
            }
        }

        const resetResult = await this.resetUser(user);

        notifyService.notify(NotificationType.USER_CREATED, {
            email: userObject.email,
            firstname: userObject.firstName,
            lastname: userObject.lastName,
            url: `${FRONT_OFFICE_URL}/auth/activate/${resetResult.token}`,
            active: user.active,
            signupAt: user.signupAt,
        });

        return user;
    }

    public getUserById(userId) {
        return userRepository.findById(userId);
    }

    async activeUser(user: UserDto | string): Promise<UserServiceError | { user: UserDto }> {
        if (typeof user === "string") {
            const foundUser = await userRepository.findByEmail(user);
            if (!foundUser) {
                throw new NotFoundError("User email does not correspond to a user");
            }
            user = foundUser;
        }

        user.active = true;

        return { user: await userRepository.update(user) };
    }

    async validateTokenAndGetType(resetToken: string): Promise<TokenValidationDtoResponse> {
        const reset = await userResetRepository.findByToken(resetToken);
        const tokenValidation = userActivationService.validateResetToken(reset);
        if (!tokenValidation.valid) return tokenValidation;

        const user = await this.getUserById((reset as UserReset).userId);
        if (!user) return { valid: false };

        return {
            ...tokenValidation,
            type: user.profileToComplete ? TokenValidationType.SIGNUP : TokenValidationType.FORGET_PASSWORD,
        };
    }

    async resetPassword(password: string, resetToken: string): Promise<UserDto> {
        const reset = await userResetRepository.findByToken(resetToken);

        const tokenValidation = userActivationService.validateResetToken(reset);
        if (!tokenValidation.valid) throw tokenValidation.error;

        const user = await this.getUserById((reset as UserReset).userId);
        if (!user) throw new UserNotFoundError();

        if (!userCheckService.passwordValidator(password))
            throw new BadRequestError(
                UserService.PASSWORD_VALIDATOR_MESSAGE,
                ResetPasswordErrorCodes.PASSWORD_FORMAT_INVALID,
            );

        const hashPassword = await userAuthService.getHashPassword(password);

        await userResetRepository.remove(reset as UserReset);

        notifyService.notify(NotificationType.USER_ACTIVATED, { email: user.email });

        const userUpdated = (await userRepository.update(
            {
                ...user,
                hashPassword,
                active: true,
                profileToComplete: false,
            },
            true,
        )) as Omit<UserDbo, "hashPassword">;
        return await userAuthService.updateJwt(userUpdated);
    }

    async forgetPassword(email: string) {
        const user = await userRepository.findByEmail(email.toLocaleLowerCase());
        if (!user) return; // Don't say user not found, for security reasons

        const resetResult = await this.resetUser(user);

        notifyService.notify(NotificationType.USER_FORGET_PASSWORD, {
            email: email.toLocaleLowerCase(),
            url: `${FRONT_OFFICE_URL}/auth/reset-password/${resetResult.token}`,
        });
    }

    async resetUser(user: UserDto): Promise<UserReset> {
        await userResetRepository.removeAllByUserId(user._id);

        const token = RandToken.generate(32);
        const reset = new UserReset(user._id, token, new Date());

        const createdReset = await userResetRepository.create(reset);

        if (!createdReset) {
            throw new InternalServerError(
                "The user reset password could not be created",
                UserServiceErrors.CREATE_RESET_PASSWORD_WRONG,
            );
        }

        user.active = false;

        await userRepository.update(user);

        return createdReset;
    }

    async findUserResetByUserId(userId: ObjectId) {
        return userResetRepository.findOneByUserId(userId);
    }

    public async listUsers(): Promise<UserWithResetTokenDto[]> {
        const users = await userStatsService.getUsersWithStats(true);
        return await Promise.all(
            users.map(async user => {
                const reset = await userResetRepository.findOneByUserId(user._id);
                return {
                    ...user,
                    resetToken: reset?.token,
                    resetTokenDate: reset?.createdAt,
                };
            }),
        );
    }

    async getUserWithoutSecret(email: string) {
        const withSecrets = await userRepository.getUserWithSecretsByEmail(email);
        if (!withSecrets) throw new NotFoundError("User not found");
        return removeSecrets(withSecrets);
    }
}

const userService = new UserService();

export default userService;

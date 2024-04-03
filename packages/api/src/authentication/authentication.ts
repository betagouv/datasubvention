import { IVerifyOptions } from "passport-local";
import { LoginRequest } from "../@types";
import { UnauthorizedError } from "../shared/errors/httpErrors";
import userActivationService from "../modules/user/services/activation/user.activation.service";

// Authentication handler used both for SSE or TSOA routes
export function expressAuthentication(req: LoginRequest, securityName = "jwt", scopes: string[] = []) {
    if (securityName !== "jwt") {
        console.warn(`${securityName} is not an valid security please change by jwt`);
        return Promise.reject(new Error("Internal server error"));
    }

    return new Promise((resolve, reject) => {
        const user = req.user;

        if (!user) {
            let errorMessage = "User not logged";
            if (req.authInfo) errorMessage = (req.authInfo as IVerifyOptions).message;
            return reject(new UnauthorizedError(errorMessage));
        }

        // If user dont have a good role
        if (!scopes.every(scope => user.roles.includes(scope))) {
            return reject(new UnauthorizedError("JWT does not contain required scope."));
        }

        resolve(userActivationService.refreshExpirationToken(user));
    });
}

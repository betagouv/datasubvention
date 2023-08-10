import { ResetPasswordErrorCodes, TokenValidationType } from "@api-subventions-asso/dto";
import { goToUrl } from "$lib/services/router.service";
import Store from "$lib/core/Store";
import authService from "$lib/resources/auth/auth.service";

export class ResetPwdController {
    PWD_REGEX = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[*.!#@$%^&(){}[\]:;<>,.?/~_+=|-]).{8,32}$/;
    ERROR_MESSAGES = {
        [ResetPasswordErrorCodes.RESET_TOKEN_NOT_FOUND]:
            "Ce lien n'est pas valide, vérifiez que l'URL est bien celle envoyée par mail.",
        [ResetPasswordErrorCodes.USER_NOT_FOUND]:
            "Ce lien n'est pas valide, vérifiez que l'URL est bien celle envoyée par mail.",
        [ResetPasswordErrorCodes.RESET_TOKEN_EXPIRED]: `Le lien a expiré, allez sur <a href="/auth/forget-password" target="_blank" rel="noopener noreferrer">la page mot de passe oublié</a> pour recevoir un nouveau lien d'activation.`,
        [ResetPasswordErrorCodes.PASSWORD_FORMAT_INVALID]:
            "Le format du mot de passe ne correspond pas aux exigences de sécurité",
    };
    DEFAULT_ERROR_MESSAGE = "Une erreur est survenue lors de la création de votre compte.";

    constructor(token) {
        this.token = token;
        const urlParams = new URLSearchParams(window.location.search);
        this.activation = urlParams.get("active");
        this.title = new Store(
            this.activation ? "Activer mon compte en créant mon mot de passe" : "Modifier votre mot de passe",
        );
        this.validatitonTokenStore = new Store("waiting");
        this.resetType = new Store(null);
        this.error = null;

        this.promise = new Store(
            token ? Promise.resolve() : Promise.reject(ResetPasswordErrorCodes.RESET_TOKEN_NOT_FOUND),
        );
        this.values = new Store({ password: "", confirm: "" });
        this.isSubmitActive = new Store(true);
    }

    async init() {
        await this._checkTokenValidity();
    }

    async _checkTokenValidity() {
        const tokenValidation = await authService.validateToken(this.token);
        if (!tokenValidation.valid) {
            this.error = { data: { code: ResetPasswordErrorCodes.RESET_TOKEN_NOT_FOUND } };
            this.validatitonTokenStore.set("invalid");
        } else {
            this.validatitonTokenStore.set("valid");
            this.resetType.set(tokenValidation.type);
            this.title.value =
                this.resetType.value === TokenValidationType.SIGNUP
                    ? "Activer mon compte en créant mon mot de passe"
                    : "Modifier votre mot de passe";
        }
    }

    getErrorMessage(error) {
        return this.ERROR_MESSAGES[error.data.code] || this.DEFAULT_ERROR_MESSAGE;
    }

    onSubmit() {
        this.promise.set(authService.resetPassword(this.token, this.values.value.password));
        return this.promise.value.then(() => {
            goToUrl("/auth/login?success=" + (this.activation ? "ACCOUNT_ACTIVATED" : "PASSWORD_CHANGED"));
        });
    }

    disableSubmit() {
        this.isSubmitActive.set(false);
    }

    enableSubmit() {
        this.isSubmitActive.set(true);
    }
}

import { SignupErrorCodes } from "@api-subventions-asso/dto";
import { getContext } from "svelte";
import Store from "@core/Store";
import authService from "@resources/auth/auth.service";

export default class SignupController {
    ERROR_MESSAGES = {
        [SignupErrorCodes.EMAIL_NOT_VALID]: "L'adresse mail fournie ne semble pas être une adresse valide.",
        [SignupErrorCodes.USER_ALREADY_EXIST]: "Un compte lié à cette adresse mail existe déjà.",
        [SignupErrorCodes.CREATION_ERROR]: `Une erreur est survenue lors de la création de votre compte. Ré-essayez plus tard ou <a href="/contact" target="_blank" rel="noopener noreferrer">contactez-nous</a>`,
        [SignupErrorCodes.CREATION_RESET_ERROR]: `Une erreur est survenue lors de la création de votre compte. Ré-essayez plus tard ou <a href="/contact" target="_blank" rel="noopener noreferrer">contactez-nous</a>`,
        [SignupErrorCodes.EMAIL_MUST_BE_END_GOUV]: `Le domaine de votre adresse e-mail n'est pas reconnu. Merci de nous adresser un e-mail à <a href="/contact" target="_blank" rel="noopener noreferrer">contact@datasubvention.beta.gouv.fr</a> pour y remédier.`,
    };

    constructor() {
        this.app = getContext("app");
        this.pageTitle = `Créer votre compte sur ${this.app.getName()}`;
        this.email = new Store("");
        this.signupPromise = new Store(Promise.resolve());
        this.firstSubmitted = new Store(false);
    }

    onSubmit() {
        this.signupPromise.set(authService.signup(this.email.value));
        this.firstSubmitted.set(true);
    }

    getErrorMessage(code) {
        return this.ERROR_MESSAGES[code] || "Une erreur est survenue lors de la création de votre compte.";
    }

    get contactEmail() {
        return this.app.getContact();
    }
}

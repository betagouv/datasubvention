import axios from "axios";
import { ResetPasswordErrorCodes, SignupErrorCodes } from "@api-subventions-asso/dto";

export class AuthPort {
    BASE_PATH = "/auth";

    signup(email) {
        const defaultErrorCode = SignupErrorCodes.CREATION_ERROR;
        const path = `${this.BASE_PATH}/signup`;
        return axios
            .post(path, { email })
            .then(result => result.data.email)
            .catch(error => {
                const errorCode = error?.response?.data?.errorCode || defaultErrorCode;
                throw new Error(errorCode);
            });
    }

    resetPassword(token, password) {
        const defaultErrorCode = ResetPasswordErrorCodes.INTERNAL_ERROR;
        const path = `${this.BASE_PATH}/reset-password`;
        return axios
            .post(path, { token, password })
            .then(() => true)
            .catch(error => {
                const errorCode = error?.response?.data?.code || defaultErrorCode;
                throw new Error(errorCode);
            })
    }
    
    login(email, password) {
        return axios
            .post("/auth/login", { email, password })
            .then(value => {
                console.log(value.data);
                return value.data.user;
            })
            .catch(e => {
                const ErrorClass = errorsService.axiosErrorToError(e);

                throw new ErrorClass({
                    message: e.response.data.message,
                    code: e.response.data.code
                });
            });
    }

    forgetPassword(email) {
        const path = `${this.BASE_PATH}/forget-password`;
        return axios.post(path, { email }).then(() => true);
    }
}

const authPort = new AuthPort();
export default authPort;

import axios from "axios";
import errorsService from "../errors/errors.service";
import { DATASUB_URL } from "$env/static/public";

class RequestsService {
    _errorHooks = [];

    constructor() {
        axios.defaults.baseURL = DATASUB_URL + "/v2";

        axios.interceptors.response.use(
            response => response,
            error => this._errorCatcher(error),
        );
    }

    get(path, params, requestOption) {
        return this._sendRequest("get", path, params, undefined, requestOption);
    }

    post(path, data, requestOption) {
        return this._sendRequest("post", path, undefined, data, requestOption);
    }

    patch(path, data, requestOption) {
        return this._sendRequest("patch", path, undefined, data, requestOption);
    }

    delete(path, params, requestOption) {
        return this._sendRequest("delete", path, params, undefined, requestOption);
    }

    addErrorHook(ErrorClass, callback) {
        this._errorHooks.push({
            ErrorClass,
            callback,
        });
    }

    _sendRequest(type, path, params, data, requestOption = {}) {
        const axiosOption = { ...requestOption };

        return axios.request({
            withCredentials: true,
            url: path,
            method: type,
            data,
            params,
            ...axiosOption,
        });
    }

    _errorCatcher(error) {
        const ErrorClass = errorsService.axiosErrorToError(error);

        const hooks = this._errorHooks.filter(hook => hook.ErrorClass === ErrorClass);
        const typedError = new ErrorClass(
            {
                message: error?.response?.data.message || error.message,
                code: error?.response?.data.code,
            },
            error,
        );

        if (hooks.length) {
            hooks.forEach(hook => {
                hook.callback(typedError);
            });
        }
        throw typedError;
    }
}

const requestsService = new RequestsService();

export default requestsService;

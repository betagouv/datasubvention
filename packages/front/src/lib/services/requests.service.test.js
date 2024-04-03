import axios from "axios";
import { NotFoundError } from "../errors";
import errorsService from "../errors/errors.service";
import { DATASUB_URL } from "$env/static/public";
import requestsService from "$lib/services/requests.service";

vi.mock("axios");

describe("RequestService", () => {
    describe("constructor", () => {
        it("should set baseUrl", () => {
            expect(axios.defaults.baseURL).toBe(DATASUB_URL + "/v2");
        });
    });

    describe("http methods", () => {
        let _sendRequestMock;

        beforeAll(() => {
            _sendRequestMock = vi.spyOn(requestsService, "_sendRequest").mockResolvedValue();
        });
        afterAll(() => {
            _sendRequestMock.mockRestore();
        });

        afterEach(() => {
            _sendRequestMock.mockClear();
        });

        describe("get", () => {
            it("should call _sendRequest", async () => {
                const expectedPath = "GET_PATH";
                const expectedParam = { test: true };
                await requestsService.get(expectedPath, expectedParam);

                expect(_sendRequestMock).toHaveBeenCalledWith("get", expectedPath, expectedParam, undefined, undefined);
            });
        });

        describe("post", () => {
            it("should call _sendRequest", async () => {
                const expectedPath = "POST_PATH";
                const expectedBody = { test: true };
                await requestsService.post(expectedPath, expectedBody);

                expect(_sendRequestMock).toHaveBeenCalledWith("post", expectedPath, undefined, expectedBody, undefined);
            });
        });

        describe("patch", () => {
            it("should call _sendRequest", async () => {
                const expectedPath = "POST_PATH";
                const expectedBody = { test: true };
                await requestsService.patch(expectedPath, expectedBody);

                expect(_sendRequestMock).toHaveBeenCalledWith(
                    "patch",
                    expectedPath,
                    undefined,
                    expectedBody,
                    undefined,
                );
            });
        });

        describe("delete", () => {
            it("should call _sendRequest", async () => {
                const expectedPath = "DELETE_PATH";
                const expectedParam = { test: true };
                await requestsService.delete(expectedPath, expectedParam);

                expect(_sendRequestMock).toHaveBeenCalledWith(
                    "delete",
                    expectedPath,
                    expectedParam,
                    undefined,
                    undefined,
                );
            });
        });
    });

    describe("addErrorHooks", () => {
        it("should add hooks in errorHooks array", () => {
            const expected = vi.fn();
            requestsService.addErrorHook(NotFoundError, expected);

            expect(requestsService._errorHooks).toEqual([
                expect.objectContaining({
                    ErrorClass: NotFoundError,
                    callback: expected,
                }),
            ]);
        });
    });

    describe("_sendRequest", () => {
        const SomeError = NotFoundError;
        let axiosRequestMock;
        let errorServiceMock;

        beforeAll(() => {
            axiosRequestMock = vi.spyOn(axios, "request").mockResolvedValue();
            errorServiceMock = vi.spyOn(errorsService, "axiosErrorToError").mockReturnValue(SomeError);
        });

        afterAll(() => {
            axiosRequestMock.mockRestore();
            errorServiceMock.mockRestore();
        });

        it("should call axios with good params", async () => {
            const type = "get";
            const path = "path/to";
            const params = { query: true };
            const data = { body: true };

            await requestsService._sendRequest(type, path, params, data);

            expect(axiosRequestMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: path,
                    method: type,
                    data,
                    params,
                }),
            );
        });
    });

    describe("_errorCatcher", () => {
        const SomeError = NotFoundError;
        let errorServiceMock;

        beforeAll(() => {
            errorServiceMock = vi.spyOn(errorsService, "axiosErrorToError").mockReturnValue(SomeError);
        });

        afterAll(() => {
            errorServiceMock.mockRestore();
        });

        it("should add __nativeError__ to typedError", () => {
            const fakeError = {
                response: {
                    data: {
                        message: "",
                        code: "",
                    },
                },
            };

            const callback = vi.fn();
            const expected = "__nativeError__";

            requestsService._errorHooks.push({
                ErrorClass: SomeError,
                callback,
            });

            try {
                requestsService._errorCatcher(fakeError);
            } catch (e) {
                expect(e).toEqual(expect.objectContaining({ [expected]: expect.any(Object) }));
            }
        });

        it("should throw SomeError", () => {
            const fakeError = {
                response: {
                    data: {
                        message: "",
                        code: "",
                    },
                },
            };

            expect(() => requestsService._errorCatcher(fakeError)).toThrowError(SomeError);
        });

        it("should call hooks", async () => {
            const fakeError = {
                response: {
                    data: {
                        message: "",
                        code: "",
                    },
                },
            };

            const callback = vi.fn();

            requestsService._errorHooks.push({
                ErrorClass: SomeError,
                callback,
            });

            try {
                requestsService._errorCatcher(fakeError);
            } catch {
                expect(callback).toBeCalledTimes(1);
            }
        });
    });
});

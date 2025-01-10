import axios from "axios";
import ProviderRequestFactory, { ProviderRequestService } from "./providerRequest.service";
import providerRequestPort from "../../dataProviders/db/provider-request/providerRequest.port";

jest.mock("../../dataProviders/db/provider-request/providerRequest.port");

describe("ProviderRequestService", () => {
    let providerRequestService: ProviderRequestService;
    let sendRequestSpy: jest.SpyInstance;
    const providerId = "ExampleProvider";

    beforeEach(() => {
        providerRequestService = ProviderRequestFactory(providerId);
    });

    describe("Get", () => {
        beforeEach(() => {
            // @ts-expect-error sendRequest is private method
            sendRequestSpy = jest.spyOn(providerRequestService, "sendRequest").mockResolvedValue({});
        });

        it("should call sendRequest Method", async () => {
            const url = "/test";
            const option = { headers: { test: true } };
            await providerRequestService.get(url, option);

            expect(sendRequestSpy).toBeCalledWith("GET", url, option);
        });
    });

    describe("options", () => {
        beforeEach(() => {
            // @ts-expect-error sendRequest is private method
            sendRequestSpy = jest.spyOn(providerRequestService, "sendRequest").mockResolvedValue({});
        });

        it("should call sendRequest Method", async () => {
            const url = "/test";
            const option = { headers: { test: true } };
            await providerRequestService.options(url, option);

            expect(sendRequestSpy).toBeCalledWith("OPTIONS", url, option);
        });
    });

    describe("post", () => {
        beforeEach(() => {
            // @ts-expect-error sendRequest is private method
            sendRequestSpy = jest.spyOn(providerRequestService, "sendRequest").mockResolvedValue({});
        });

        it("should call sendRequest Method", async () => {
            const url = "/test";
            const option = { headers: { test: true }, data: {} };
            await providerRequestService.post(url, {}, option);

            expect(sendRequestSpy).toBeCalledWith("POST", url, option);
        });
    });

    describe("createLog", () => {
        let portCreateSpy: jest.SpyInstance;

        beforeAll(() => {
            portCreateSpy = jest.spyOn(providerRequestPort, "create").mockResolvedValue();
        });

        it("should call port", async () => {
            const url = "/test";
            const date = new Date();
            const responseCode = 200;
            const type = "GET";

            // @ts-expect-error createlog is private method
            await providerRequestService.createLog(url, date, responseCode, type);

            expect(portCreateSpy).toHaveBeenCalledWith({
                providerId,
                route: url,
                date,
                responseCode,
                type,
            });
        });
    });

    describe("sendRequest", () => {
        let createLogSpy: jest.SpyInstance;

        beforeEach(() => {
            // @ts-expect-error createLog is private method
            createLogSpy = jest.spyOn(providerRequestService, "createLog").mockResolvedValue({});

            (axios.request as jest.Mock).mockResolvedValue({ status: 200 });
        });

        it("should call axios request", async () => {
            const url = "/test";
            const method = "GET";
            const headers = {
                test: true,
            };

            // @ts-expect-error sendRequest is private method
            await providerRequestService.sendRequest(method, url, {
                headers,
            });

            expect(axios.request).toHaveBeenCalledWith({
                method,
                url,
                headers,
            });
        });

        it("should call createLog", async () => {
            const url = "/test";
            const method = "GET";
            const headers = {
                test: true,
            };

            // @ts-expect-error sendRequest is private method
            await providerRequestService.sendRequest(method, url, {
                headers,
            });

            expect(createLogSpy).toHaveBeenCalledWith(url, expect.any(Date), 200, method);
        });

        it("should call createLog when error", async () => {
            const url = "/test";
            const method = "GET";
            const headers = {
                test: true,
            };

            const statusCode = 400;

            (axios.request as jest.Mock).mockRejectedValueOnce({ status: statusCode });

            try {
                // @ts-expect-error sendRequest is private method
                await providerRequestService.sendRequest(method, url, {
                    headers,
                });
            } catch {
                expect(createLogSpy).toHaveBeenCalledWith(url, expect.any(Date), statusCode, method);
            }
        });
    });
});

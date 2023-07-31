import axios from "axios";
import authPort from "$lib/resources/auth/auth.port";
import authService from "$lib/resources/auth/auth.service";
import crispService from "$lib/services/crisp.service";

const mocks = vi.hoisted(() => {
  return {
    DEFAULT_ERROR_CODE: 49,
  }
})

vi.mock("@api-subventions-asso/dto", async () => {
    const actual = await vi.importActual("@api-subventions-asso/dto")
    return {
        ...actual,
        SignupErrorCodes: { EMAIL_NOT_VALID: mocks.DEFAULT_ERROR_CODE },
        ResetPasswordErrorCodes: { INTERNAL_ERROR: mocks.DEFAULT_ERROR_CODE },
        __esModule: true, // this property makes it work
    }
});

describe("authService", () => {
    describe("signup()", () => {
        const portMock = vi.spyOn(authPort, "signup");
        const RES = {};
        const USER = { email: "test@mail.fr", lastname: "", firstname: "" };

        beforeAll(() => portMock.mockResolvedValue(RES));
        afterAll(() => portMock.mockRestore());

        it("rejects with appropriate code if no email", () => {
            const test = () => authService.signup();
            expect(test).rejects.toBe(mocks.DEFAULT_ERROR_CODE);
        });

        it("calls port", async () => {
            await authService.signup(USER);
            expect(portMock).toHaveBeenCalledWith(USER);
        });

        it("return result from port if success", async () => {
            const expected = RES;
            const actual = await authService.signup(USER);
            expect(expected).toBe(actual);
        });

        it("rejects with error code from port if given", () => {
            const expected = { message: 5 };
            portMock.mockRejectedValueOnce(expected);
            const actual = authService.signup(USER);
            expect(actual).rejects.toBe(expected);
        });
    });

    describe("resetPassword()", () => {
        const portMock = vi.spyOn(authPort, "resetPassword");
        const RES = true;
        const PASSWORD = "very secret";
        const TOKEN = "123";

        beforeAll(() => portMock.mockResolvedValue(true));
        afterAll(() => portMock.mockRestore());

        it("rejects with appropriate code if no token", () => {
            const test = () => authService.resetPassword();
            // expect(test).rejects.toBe(DEFAULT_ERROR_CODE);
        });

        it("calls port", async () => {
            await authService.resetPassword(TOKEN, PASSWORD);
            expect(portMock).toHaveBeenCalledWith(TOKEN, PASSWORD);
        });

        it("return result from port if success", async () => {
            const expected = RES;
            const actual = await authService.resetPassword(TOKEN, PASSWORD);
            expect(expected).toBe(actual);
        });
    });

    describe("forgetPassword()", () => {
        const portMock = vi.spyOn(authPort, "forgetPassword");
        const RES = true;
        const EMAIL = "test@test.fr";

        beforeAll(() => portMock.mockResolvedValue(true));
        afterAll(() => portMock.mockRestore());

        it("rejects if no email", () => {
            const test = () => authService.forgetPassword();
            expect(test).rejects.toBeUndefined();
        });

        it("calls port", async () => {
            await authService.forgetPassword(EMAIL);
            expect(portMock).toHaveBeenCalledWith(EMAIL);
        });

        it("return result from port if success", async () => {
            const expected = RES;
            const actual = await authService.forgetPassword(EMAIL);
            expect(expected).toBe(actual);
        });
    });

    describe("login()", () => {
        const crispServiceMock = vi.spyOn(crispService, "setUserEmail").mockImplementation(vi.fn());
        const mockPort = vi.spyOn(authPort, "login");
        it("should call port", async () => {
            const expected = ["test@datasubvention.beta.gouv.fr", "fake-password"];

            mockPort.mockResolvedValueOnce({});

            await authService.login(...expected);
            expect(mockPort).toHaveBeenCalledWith(...expected);
        });

        it("should save user in local storage", async () => {
            const expected = { _id: "USER_ID" };

            mockPort.mockResolvedValueOnce(expected);

            await authService.login("", "");
            const actual = JSON.parse(localStorage.getItem(authService.USER_LOCAL_STORAGE_KEY));
            expect(actual).toEqual(expected);
        });

        it("sets crisp email value", async () => {
            const EMAIL = "a@b.c";
            mockPort.mockResolvedValueOnce({ email: EMAIL });
            await authService.login(EMAIL, "");
            expect(crispServiceMock).toBeCalledWith(EMAIL);
        });

        it("should return user", async () => {
            const expected = { _id: "USER_ID" };

            mockPort.mockResolvedValueOnce(expected);

            const actual = await authService.login("", "");
            expect(actual).toEqual(expected);
        });
    });

    describe("initUserInApp", () => {
        const crispServiceMock = vi.spyOn(crispService, "setUserEmail").mockImplementation(vi.fn());
        const getCurrentUserMock = vi.spyOn(authService, "getCurrentUser");

        afterAll(() => {
            getCurrentUserMock.mockRestore();
        });

        it("should be axios header", async () => {
            const expected = "FAKE_TOKEN";
            getCurrentUserMock.mockReturnValueOnce({ jwt: { token: expected } });

            await authService.initUserInApp();
            const actual = axios.defaults.headers.common["x-access-token"];

            expect(actual).toBe(expected);
        });

        it("sets crisp email value", async () => {
            const EMAIL = "a@b.c";
            getCurrentUserMock.mockReturnValueOnce({ email: EMAIL });
            await authService.initUserInApp();
            expect(crispServiceMock).toBeCalledWith(EMAIL);
        });
    });

    describe("logout", () => {
        // Use Storage.prototype because localstorage mock not work. See https://stackoverflow.com/questions/32911630/how-do-i-deal-with-localstorage-in-vi-tests
        const localStorageMock = vi.spyOn(Storage.prototype, "removeItem");
        it("should call removeItem on localStorage", () => {
            authService.logout();

            expect(localStorageMock).toBeCalledWith(authService.USER_LOCAL_STORAGE_KEY);
        });

        it("resets crisp session", () => {
            const crispServiceMock = vi.spyOn(crispService, "resetSession").mockImplementation(vi.fn());
            authService.logout();
            expect(crispServiceMock).toBeCalled();
        });
    });

    describe("getCurrentUser", () => {
        // Use Storage.prototype because localstorage mock not work. See https://stackoverflow.com/questions/32911630/how-do-i-deal-with-localstorage-in-vi-tests
        const localStorageMock = vi.spyOn(Storage.prototype, "getItem");
        it("should call getItem on localStorage", () => {
            authService.getCurrentUser();

            expect(localStorageMock).toBeCalledWith(authService.USER_LOCAL_STORAGE_KEY);
        });
    });
});

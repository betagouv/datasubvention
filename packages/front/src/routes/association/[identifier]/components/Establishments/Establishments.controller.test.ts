import type { SpyInstance } from "vitest";
import { EstablishmentsController } from "./Establishments.controller";
import Store from "$lib/core/Store";
import type { SimplifiedEstablishment } from "$lib/resources/establishments/types/establishment.types";
vi.mock("$lib/core/Store");

describe("EstablishmentsController", () => {
    let controller: EstablishmentsController;

    beforeEach(() => {
        controller = new EstablishmentsController();
    });

    describe("onFilter()", () => {
        const FILTER = "FILTER";
        const FILTERED_ESTABLISHMENTS = [] as SimplifiedEstablishment[];
        let mockFilterEstablishments: SpyInstance;
        let mockSetTotalPages: SpyInstance;
        let mockRenderPages: SpyInstance;

        beforeEach(() => {
            controller.filteredEstablishments = new Store([]);
            mockFilterEstablishments = vi
                // @ts-expect-error: private method
                .spyOn(controller, "filterEstablishments")
                // @ts-expect-error: ?
                .mockReturnValue(FILTERED_ESTABLISHMENTS);
            mockSetTotalPages = vi.spyOn(controller, "setTotalPages").mockImplementation(vi.fn());
            mockRenderPages = vi.spyOn(controller, "renderPage").mockImplementation(vi.fn());
        });

        // afterEach(() => {
        //     mockFilterEstablishments.mockReset();
        //     mockSetTotalPages.mockReset();
        //     mockRenderPages.mockReset();
        // });

        it("should call filterEstablishments()", () => {
            controller.onFilter(FILTER);
            expect(mockFilterEstablishments).toHaveBeenCalledWith(FILTER);
        });

        it("should call setTotalPages()", () => {
            controller.onFilter(FILTER);
            expect(mockSetTotalPages).toHaveBeenCalled();
        });

        it("should call renderPage()", () => {
            controller.onFilter(FILTER);
            expect(mockRenderPages).toHaveBeenCalled();
        });

        it("should set filteredEstablishments", () => {
            controller.onFilter(FILTER);
            expect(controller.filteredEstablishments.set).toHaveBeenCalledWith(FILTERED_ESTABLISHMENTS);
        });
    });

    describe("filterEstablishments", () => {
        let mockGetter: SpyInstance;
        const ESTABLISHMENT = { adresse: { code_postal: "93100" }, siret: "45000000000019" };

        beforeAll(() => {
            mockGetter = vi.spyOn(Store.prototype, "value", "get").mockReturnValue([ESTABLISHMENT]);
            // @ts-expect-error: mock
            controller.establishmentsStore = new Store();
        });

        afterAll(() => {
            mockGetter.mockReset();
        });

        it("should filter establishment", () => {
            const expected = [];
            // @ts-expect-error: private method
            const actual = controller.filterEstablishments("932");
            expect(actual).toEqual(expected);
        });

        it("should not filter establishment", () => {
            const expected = [ESTABLISHMENT];
            // @ts-expect-error: private method
            const actual = controller.filterEstablishments("931");
            expect(actual).toEqual(expected);
        });
    });

    describe("resetFilter", () => {
        const FILTERED_ESTABLISHMENTS = [] as SimplifiedEstablishment[];
        let mockSetTotalPages: SpyInstance;
        let mockRenderPages: SpyInstance;

        beforeEach(() => {
            vi.spyOn(Store.prototype, "value", "get").mockReturnValue([]);
            controller.filteredEstablishments = new Store([]);
            // @ts-expect-error: private method
            vi.spyOn(controller, "filterEstablishments").mockReturnValue(FILTERED_ESTABLISHMENTS);
            mockSetTotalPages = vi.spyOn(controller, "setTotalPages").mockImplementation(vi.fn());
            mockRenderPages = vi.spyOn(controller, "renderPage").mockImplementation(vi.fn());
        });

        it("should call setTotalPages()", () => {
            controller.resetFilter();
            expect(mockSetTotalPages).toHaveBeenCalled();
        });

        it("should call renderPage()", () => {
            controller.resetFilter();
            expect(mockRenderPages).toHaveBeenCalled();
        });

        it("should set filteredEstablishments", () => {
            controller.resetFilter();
            expect(controller.filteredEstablishments.set).toHaveBeenCalledWith(FILTERED_ESTABLISHMENTS);
        });
    });

    describe("onEstablishementsUpdated", () => {
        let mockSetTotalPages: SpyInstance;
        let mockRenderPages: SpyInstance;

        beforeEach(() => {
            mockSetTotalPages = vi.spyOn(controller, "setTotalPages").mockImplementation(vi.fn());
            mockRenderPages = vi.spyOn(controller, "renderPage").mockImplementation(vi.fn());
        });

        it("should call setTotalPages()", () => {
            controller.onEstablishementsUpdated();
            expect(mockSetTotalPages).toHaveBeenCalled();
        });

        it("should call renderPage()", () => {
            controller.onEstablishementsUpdated();
            expect(mockRenderPages).toHaveBeenCalled();
        });
    });

    describe("setTotalPages", () => {
        let mockGetter: SpyInstance;

        beforeEach(() => {
            mockGetter = vi.spyOn(Store.prototype, "value", "get").mockReturnValue([]);
            controller.totalPages = new Store(0);
            controller.filteredEstablishments = new Store([{} as SimplifiedEstablishment]);
        });

        afterEach(() => {
            mockGetter.mockReset();
        });

        it("should set totalPages to 1", () => {
            mockGetter.mockReturnValue([{}, {}, {}, {}, {}] as SimplifiedEstablishment[]);
            controller.setTotalPages();
            expect(controller.totalPages.set).toHaveBeenCalledWith(1);
        });

        it("should set totalPages to 2", () => {
            mockGetter.mockReturnValue([
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
                {},
            ] as SimplifiedEstablishment[]);
            controller.setTotalPages();
            expect(controller.totalPages.set).toHaveBeenCalledWith(2);
        });
    });

    describe("renderPage", () => {
        const ESTABLISHMENTS = [{}, {}];
        let mockGetter: SpyInstance;
        beforeEach(() => {
            mockGetter = vi.spyOn(Store.prototype, "value", "get").mockReturnValueOnce(1);
            mockGetter.mockReturnValueOnce(ESTABLISHMENTS);
        });

        afterEach(() => {
            mockGetter.mockReset();
        });

        it("should set visibleEstablishments", () => {
            controller.renderPage();
            expect(controller.visibleEstablishments.set).toHaveBeenCalledWith(ESTABLISHMENTS);
        });
    });

    describe("changePage", () => {
        let mockRenderPage: SpyInstance;

        beforeEach(() => {
            mockRenderPage = vi.spyOn(controller, "renderPage").mockImplementation(vi.fn());
        });

        it("should call renderPage()", () => {
            controller.changePage();
            expect(mockRenderPage).toHaveBeenCalled();
        });
    });
});

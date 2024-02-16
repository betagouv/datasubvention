import { Request as ExRequest } from "express";
import { Controller, Get, Request, Route } from "tsoa";
import { Version, VersionedController } from "../../shared/Version.Decorator";
const VERSION = "v2";
const DEFAULT_TSOA_METHOD_NAME = "";

@Route("/test")
@VersionedController()
export class TestHttp extends Controller {
    @Get()
    @Version("v1", "getTest")
    getTest(@Request() _req: ExRequest) {
        return "v1";
    }

    @Version("v2", "getTest")
    getTestV2(_req: ExRequest) {
        return "v2";
    }

    @Version(VERSION, DEFAULT_TSOA_METHOD_NAME)
    getTestVN(_req: ExRequest) {
        return "v(N)";
    }
}

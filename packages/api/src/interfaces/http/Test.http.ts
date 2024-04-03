import { Controller, Get, Request, Route } from "tsoa";

@Route("/test")
export class TestHttp extends Controller {
    @Get()
    getTest(@Request() req) {
        if (req.apiVersion === "v1") {
            console.log("do v1 action");
        } else {
            console.log("do v2 action");
        }
    }
}

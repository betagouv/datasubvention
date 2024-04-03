/* eslint-disable @typescript-eslint/no-namespace */
import express, { NextFunction, Response } from "express";
import passport from "passport";
import cookieParser from "cookie-parser";
import * as Sentry from "@sentry/node";

import cors from "cors";

import { RegisterRoutes } from "../tsoa/routes";
import { authMocks } from "./authentication/express.auth.hooks";
import { expressLogger } from "./middlewares/LogMiddleware";
import { AssetsMiddleware } from "./middlewares/AssetsMiddleware";
import { BodyParserJSON, BodyParserUrlEncoded } from "./middlewares/BodyParserMiddleware";
import { docsMiddlewares } from "./middlewares/DocsMiddleware";
import { errorHandler } from "./middlewares/ErrorMiddleware";
import RegisterSSERoutes from "./sse";
import StatsAssoVisitMiddleware, { StatsAssoVisitRoutesRegex } from "./middlewares/StatsAssoVisitMiddleware";
import UserActivityMiddleware from "./middlewares/UserActivityMiddleware";
import { IdentifiedRequest } from "./@types";
import { initCron } from "./cron";
import { headersMiddleware } from "./middlewares/headersMiddleware";
import { ENV } from "./configurations/env.conf";
import { versionMiddleware } from "./middlewares/VersionMiddleware";

const appName = "api-subventions-asso";

async function factoryEndMiddleware(
    req: IdentifiedRequest,
    res: Response,
    next: NextFunction,
    middleware: (req: IdentifiedRequest, res: Response) => void,
) {
    res.on("finish", () => middleware(req, res));
    next();
}

export async function startServer(port = "8080", isTest = false) {
    port = process.env.PORT || port;
    const app = express();

    if (ENV !== "dev" && ENV !== "test") Sentry.init({ release: process.env.npm_package_version });

    app.use(versionMiddleware);
    app.use(Sentry.Handlers.requestHandler());
    app.use(cookieParser());
    app.use(
        cors({
            credentials: true,
            origin: true,
        }),
    );

    if (!isTest) app.use(expressLogger());

    app.use("/assets", AssetsMiddleware);
    app.use(BodyParserUrlEncoded);
    app.use(BodyParserJSON);

    app.use(passport.initialize());
    authMocks(app); // Passport Part

    StatsAssoVisitRoutesRegex.forEach(route =>
        app.use(route, (req, res, next) =>
            factoryEndMiddleware(req as IdentifiedRequest, res, next, StatsAssoVisitMiddleware),
        ),
    );

    app.use((req, res, next) => UserActivityMiddleware(req as IdentifiedRequest, res, next));

    app.use(headersMiddleware);

    // const router = express.Router();

    RegisterRoutes(app); // TSOA Part

    RegisterSSERoutes(app); // SSE Part

    app.use("/:version/docs", ...(await docsMiddlewares()));

    app.use(Sentry.Handlers.errorHandler());

    app.use(errorHandler(isTest));

    initCron();

    return app.listen(port, () => {
        if (!isTest) console.log(`${appName} listening at http://localhost:${port}`);
    });
}

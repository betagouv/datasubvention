import passport from "passport";
import { Express, Request } from "express";
import { Strategy as JwtStrategy } from "passport-jwt";
import { UserDto } from "dto";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { JWT_SECRET } from "../configurations/jwt.conf";
import { getJtwTokenFromRequest } from "../shared/helpers/HttpHelper";
import userAuthService from "../modules/user/services/auth/user.auth.service";

// COMMENT: why authMocks ? authHandler should be a better name, no ?
export function authMocks(app: Express) {
    /**
     *  Sessions
     *  TODO: is this really used ? in doc we should use app.use(passport.sessions()) to make use persistent login sessions
     *  cf : https://github.com/jaredhanson/passport?tab=readme-ov-file#middleware
     */

    passport.serializeUser((user, done) => {
        done(null, user);
    });

    passport.deserializeUser((user: UserDto, done) => {
        done(null, user);
    });

    /**
     *  Authenticated requests
     */

    app.post("/:version/auth/login", (req, res, next) => {
        passport.authenticate("login", (error, user, info: IVerifyOptions) => {
            if (error) return next(error);
            if (user) {
                req.user = user;
            }
            req.authInfo = info;

            next();
        })(req, res, next);
    });

    /**
     *  Middlewares
     */

    // A passport middleware to handle User login
    // It is called by passport.authenticate("login", ...)
    passport.use(
        "login",
        new LocalStrategy(
            {
                usernameField: "email",
                passwordField: "password",
            },
            async (email, password, done) => {
                console.log("passport login middleware");
                try {
                    const user = await userAuthService.login(email.toLocaleLowerCase(), password);
                    return done(null, user, { message: "Logged in Successfully" });
                } catch (e) {
                    done(e);
                }
            },
        ),
    );

    // Verifies that the token sent by the user is valid
    // It is called by passport.authenticate("jwt", ...)
    passport.use(
        new JwtStrategy(
            {
                secretOrKey: JWT_SECRET,
                jwtFromRequest: getJtwTokenFromRequest,
                passReqToCallback: true,
            },
            async (req: Request, tokenPayload, done) => {
                console.log("passport jwt middleware", tokenPayload, getJtwTokenFromRequest(req));
                try {
                    const user = await userAuthService.authenticate(tokenPayload, getJtwTokenFromRequest(req));
                    if (user) return done(null, user, { message: "Logged in Successfully" });
                    return done();
                } catch (e) {
                    done(e);
                }
            },
        ),
    );

    app.use((req, res, next) => {
        if (req.authInfo) return next(); // if authInfo is not empty then the authentication is already check -> only done if previous step was login ?

        passport.authenticate("jwt", (error, user: UserDto, info: IVerifyOptions) => {
            if (user && !error) {
                req.user = user;
            }
            req.authInfo = info;

            next();
        })(req, res, next);
    });
}

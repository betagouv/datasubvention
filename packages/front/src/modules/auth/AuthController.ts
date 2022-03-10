import { NextFunction, Request, Response } from 'express';
import { DefaultObject } from '../../@types/utils';
import Controller from '../../decorators/controller.decorator';
import { Get, Post } from '../../decorators/http.methods.decorator';
import apiDatasubService from '../../shared/apiDatasub.service';

@Controller("/auth")
export default class AuthController {

    @Get("logout")
    public logout(req: Request, res: Response, next: NextFunction) {
        req.session.destroy((err) => {
            if (err) console.error(err);
            res.redirect("/auth/login");
        });
    }

    @Get("login")
    public loginView(req: Request, res: Response, next: NextFunction) {
        res.render('auth/login/login', {
            pageTitle: 'Connexion',
            success: req.query.success,
        })
    }

    @Post("login")
    public loginPost(req: Request, res: Response, next: NextFunction) {
        if (!req.body.email || !req.body.password) {
            return res.render("auth/login/login", {
                pageTitle: 'Connexion',
                loginError: true
            });
        }
        apiDatasubService.login(req.body.email as string, req.body.password).then((result) => {
            if (result.status != 200) {
                res.statusCode = 422;
                return res.render("auth/login/login", {
                    pageTitle: 'Connexion',
                    loginError: true
                });
            }
            const sessionData = req.session as unknown as DefaultObject;
            sessionData.user = result.data
            res.redirect("/")
        }).catch(() =>  res.render("auth/login/login", {
            pageTitle: 'Connexion',
            loginError: true
        }))
    }

    @Get("reset-password/*")
    public resetPasswordView(req: Request, res: Response, next: NextFunction) {
        const [id] = req.url.split("/auth/reset-password/")[1].split("?");
        
        if (!id) {
            res.statusCode = 422;
            return res.render("error");
        }

        res.render('auth/reset-password/resetPassword', {
            pageTitle: 'Changement de mot de passe',
            token: id,
            activation: req.query.active
        })
    }

    @Post("reset-password/*")
    public resetPasswordPost(req: Request, res: Response, next: NextFunction) {
        if (!req.body.token || !req.body.password) {
            const [id] = req.url.split("/auth/reset-password/")[1].split("?");

            if (!id) {
                res.statusCode = 422;
                return res.render("error");
            }
            return res.render('auth/reset-password/resetPassword', {
                pageTitle: 'Changement de mot de passe',
                token: id,
                activation: req.query.active,
                error: "WRONG_FIELD"
            });
        }

        apiDatasubService.resetPassword(req.body.token as string, req.body.password).then((result) => {
            console.log(result.data);
            if (result.status != 200) {
                res.statusCode = 422;
                return res.render('auth/reset-password/resetPassword', {
                    pageTitle: 'Changement de mot de passe',
                    token: req.body.token,
                    activation: req.query.active,
                    error: "WRONG_FIELD"
                });
            }
            res.redirect("/auth/login?success=" + (req.query.active ? "COMPTE_ACTIVED" : "PASSWORD_CHANGED"));
        }).catch(() => res.render('auth/reset-password/resetPassword', {
            pageTitle: 'Changement de mot de passe',
            token: req.body.token,
            activation: req.query.active,
            error: "WRONG_FIELD"
        }));
    }
}
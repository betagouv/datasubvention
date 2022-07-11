import UserDto from '@api-subventions-asso/dto/user/UserDto';
import { Request as ExRequest } from 'express';
import { ObjectId } from 'mongodb';
import { Route, Controller, Tags, Post, Body, Security, Put, Request, Get, Delete, Path } from 'tsoa';
import User, { UserWithoutSecret } from '../../entities/User';
import userService from '../../user.service';

@Route("user")
@Tags("User Controller")
@Security("jwt")
export class UserController extends Controller {

    @Post("/admin/roles")
    @Security("jwt", ['admin'])
    public async upgradeUserRoles(
        @Body() body: { email: string, roles: string[] },
    ) {
        const result = await userService.addRolesToUser(body.email, body.roles);

        if (!result.success) {
            this.setStatus(500);
        }
        return result
    }

    @Get("/admin/list-users")
    @Security("jwt", ['admin'])
    public async listUsers(): Promise<{success: boolean , users: UserDto[]}> {
        const result = await userService.listUsers();

        if (!result.success) {
            this.setStatus(500);
        }
        return result;
    }

    @Post("/admin/create-user")
    @Security("jwt", ['admin'])
    public async createUser(
        @Body() body: { email: string },
    ): Promise<{success: boolean , email: string}> {
        const result = await userService.createUsersByList([body.email]);

        if (!result[0].success) {
            this.setStatus(500);
        }
        return result[0];
    }

    @Delete("/admin/user/:id")
    @Security("jwt", ['admin'])
    public async deleteUser(
        @Path() id: string
    ): Promise<{success: boolean }> {
        const result = await userService.delete({_id: new ObjectId(id)});

        if (!result.success) {
            this.setStatus(500);
        }
        else {
            this.setStatus(204)
        }
        return result;
    }
    

    @Get("/roles")
    @Security("jwt", ['user'])
    public async getRoles(
        @Request() request: Express.Request
    ): Promise<{success: boolean , roles: string[]}> {
        const roles = userService.getRoles(request.user as unknown as User);

        return {
            success: true,
            roles
        };
    }

    @Put("/password")
    public async changePassword(
        @Request() req: ExRequest,
        @Body() body: { password: string }
    ) {
        const user = req.user as UserWithoutSecret;
        const result = await userService.updatePassword(user, body.password);

        if (!result.success) {
            this.setStatus(500);
        }
        return result;
    }
}

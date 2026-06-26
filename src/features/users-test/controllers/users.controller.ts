import { Request, Response } from "opticore-express";
import { ResponseHandler, HttpStatusCode, IResponseHandlerSuccessData } from "opticore-http-response";
import { UsersService } from "../services/users.service";
import { UsersModel } from "../models/users.model";


export class UsersController {

    static async findAll(): Promise<IResponseHandlerSuccessData | ReturnType<typeof ResponseHandler.error>> {
        const users: UsersModel[] = await this.usersService().findAll();

        return ResponseHandler.success(
            {
                count: users.length,
                data: users
            },
            "success",
            HttpStatusCode.OK
        );
    }

    static async findById(req: Request): Promise<IResponseHandlerSuccessData | ReturnType<typeof ResponseHandler.error>> {
        const { id } = req.params;
        const user: UsersModel | null = await this.usersService().findById(id as string);
        if (!user) {
            return ResponseHandler.error(`User with id "${id}" not found`, HttpStatusCode.NOT_FOUND);
        }

        return ResponseHandler.success(user, "success", HttpStatusCode.OK);
    }

    static async create(req: Request, res: Response): Promise<IResponseHandlerSuccessData | ReturnType<typeof ResponseHandler.error>> {
        const { firstName, lastName, email } = req.body;
        if (!firstName || !lastName || !email) {
            return ResponseHandler.error(
                "firstName, lastName and email are required",
                HttpStatusCode.BAD_REQUEST
            );
        }
        const user: UsersModel = await this.usersService().create({ firstName, lastName, email });

        return ResponseHandler.success(user, "created", HttpStatusCode.CREATED);
    }

    static async update(req: Request): Promise<IResponseHandlerSuccessData | ReturnType<typeof ResponseHandler.error>> {
        const { id } = req.params;
        const user = await this.usersService().update(id as string, req.body);
        if (!user) {
            return ResponseHandler.error(`User with id "${id}" not found`, HttpStatusCode.NOT_FOUND);
        }

        return ResponseHandler.success(user, "success", HttpStatusCode.OK);
    }

    static async delete(req: Request): Promise<IResponseHandlerSuccessData | ReturnType<typeof ResponseHandler.error>> {
        const { id } = req.params;
        const deleted: boolean = await this.usersService().delete(id as string);
        if (!deleted) {
            return ResponseHandler.error(`User with id "${id}" not found`, HttpStatusCode.NOT_FOUND);
        }

        return ResponseHandler.success(null, "deleted", HttpStatusCode.NO_CONTENT);
    }

    private static handleError(error: unknown) {
        const message: string = error instanceof Error ? error.message : "Internal server error";

        return ResponseHandler.error(message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }

    private static usersService(): UsersService {
        return new UsersService();
    }
}
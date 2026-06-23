import { UsersRepository } from "../repositories/users.repository";
import { UsersModel } from "../models/users.model";

export class UsersService {
    private readonly repository: UsersRepository;

    constructor() {
        this.repository = new UsersRepository();
    }

    async findAll(): Promise<UsersModel[]> {
        return this.repository.findAll();
    }

    async findById(id: string): Promise<UsersModel | null> {
        return this.repository.findById(id);
    }

    async create(data: { firstName: string; lastName: string; email: string }): Promise<UsersModel> {
        const model = new UsersModel(
            crypto.randomUUID(),
            data.firstName,
            data.lastName,
            data.email,
        );

        return this.repository.create(model);
    }

    async update(id: string, data: Partial<{ firstName: string; lastName: string; email: string }>): Promise<UsersModel | null> {
        const existing = await this.repository.findById(id);
        if (!existing) return null;
        if (data.firstName) existing.firstName = data.firstName;
        if (data.lastName) existing.lastName = data.lastName;
        if (data.email) existing.email = data.email;
        return this.repository.update(existing);
    }

    async delete(id: string): Promise<boolean> {
        return this.repository.delete(id);
    }
}
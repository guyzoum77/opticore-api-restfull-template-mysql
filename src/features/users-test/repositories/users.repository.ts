import { UsersModel } from "../models/users.model";

export class UsersRepository {
    private store: Map<string, UsersModel> = new Map();

    async findAll(): Promise<UsersModel[]> {
        return Array.from(this.store.values());
    }

    async findById(id: string): Promise<UsersModel | null> {
        return this.store.get(id) ?? null;
    }

    async create(model: UsersModel): Promise<UsersModel> {
        this.store.set(model.id, model);
        return model;
    }

    async update(model: UsersModel): Promise<UsersModel | null> {
        if (!this.store.has(model.id)) return null;
        model.updatedAt = new Date();
        this.store.set(model.id, model);
        return model;
    }

    async delete(id: string): Promise<boolean> {
        return this.store.delete(id);
    }
}
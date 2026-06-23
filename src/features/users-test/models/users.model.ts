export class UsersModel {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;

    constructor(
        id: string,
        firstName: string,
        lastName: string,
        email: string,
        createdAt?: Date,
        updatedAt?: Date,
    ) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.createdAt = createdAt ?? new Date();
        this.updatedAt = updatedAt ?? new Date();
    }
}
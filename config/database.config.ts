import { mySqlCheckerDatabase, optionalArgumentConnection } from "opticore-core-module";

/**
 * mySqlCheckerDatabase is function with an optional params.
 * So if you desire use an optional params define it in .env file.
 * So in your .env file, you will have :
 * ARGUMENTS_DATABASE_CONNECTION=?sslidentity=client-identity.p12&sslpassword=mypassword&sslcert=rootca.cert
 */
export const dbConnection = (): void => { mySqlCheckerDatabase(optionalArgumentConnection); }
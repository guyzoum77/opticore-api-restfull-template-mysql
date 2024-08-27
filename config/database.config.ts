import {DbConnexionConfig} from "opticore-core-module";

/**
 * databaseMySQLConnexionChecker is function with an optional params.
 * So if you desire use an optional params used databaseMySQLConnexionChecker() with your params instead databaseMySQLConnexionChecker
 */
export const dbConnection = new DbConnexionConfig().databaseMySQLConnexionChecker;
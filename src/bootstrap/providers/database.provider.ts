import { IWebServerContext } from "opticore-webapp";
import { OptiCoreMySQLDriver } from "opticore-mysqldb";


/**
 * The MySQL driver, built once the server listens. It connects on the first query: its connection check
 * (`connect()`) ends the process when the database cannot be reached, so it is not run at startup.
 */
export const connectMySQL = ({ environment }: IWebServerContext): OptiCoreMySQLDriver =>
    new OptiCoreMySQLDriver(environment, environment.defaultLocal);

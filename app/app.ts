import {Server} from "node:net";
import {Kernel} from "./core/kernel";
import {coreAppOptions} from "../config/coreAppOptions";
import {CoreApplication, dateTimeFormattedUtils, getEnvVariable} from "opticore-core-module";


export const appInit = (): void => {
    const host: string = getEnvVariable.appHost;
    const port: number = Number(getEnvVariable.appPort);

    const entryApp: CoreApplication = new CoreApplication(coreAppOptions.corsOptions, coreAppOptions.optionsUrlencoded);
    const server: Server = entryApp.onStartServer(host, port);

    entryApp.onListeningOnServerEvent(server, host, port, Kernel());
    entryApp.onRequestOnServerEvent(server, host, port, dateTimeFormattedUtils);
}
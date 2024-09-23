import {CoreApplication, dateTimeFormattedUtils, getEnvVariable} from "opticore-core-module";
import {Server} from "node:net";
import {Kernel} from "./core/kernel";


const entryApp: CoreApplication = new CoreApplication();
const server: Server = entryApp.onStartServer(getEnvVariable.appHost, Number(getEnvVariable.appPort));
entryApp.onListeningOnServerEvent(server, getEnvVariable.appHost, Number(getEnvVariable.appPort), Kernel());
entryApp.onRequestOnServerEvent(server, getEnvVariable.appHost, Number(getEnvVariable.appPort), dateTimeFormattedUtils);
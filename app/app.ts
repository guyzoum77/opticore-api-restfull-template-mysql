import {server, serverListen, serverParams} from "opticore-core-module";

export const app = () => {
    const webServer: serverListen = new serverListen();
    server(webServer, serverParams);
}
import {server, serverListen, serverParams} from "opticore-core-module";

export const app = () => {
    server(new serverListen(), serverParams);
}
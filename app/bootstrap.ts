import {CoreApplication, currentDate, env, getEnvVariable, KernelModuleInterface, express} from "opticore-core-module";
import {Server} from "node:net";
import {Kernel} from "./core/kernel";

export class Bootstrap {
    private static env: env<any> = new env(getEnvVariable);
    private static app: express.Application = express();
    private static entryApp: CoreApplication = new CoreApplication();

    static run(): void {
        const [routers, dbConn] = Kernel(this.app);
        const server: Server = this.entryApp.onStartServer(this.env.get("appHost"), Number(this.env.get("appPort")), routers);

        this.entryApp.onListeningOnServerEvent(server, Kernel(this.app) as KernelModuleInterface[]);
        this.entryApp.onRequestOnServerEvent(server, this.env.get("appHost"), Number(this.env.get("appPort")), currentDate);
    }
}
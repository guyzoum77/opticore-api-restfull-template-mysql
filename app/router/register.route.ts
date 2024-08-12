import {express} from "opticore-core-module";


/**
 * This is the register where we define all application appRoutes.
 */

export class RegisterRoute {
    public router: express.application = express();

    constructor(app: express.application) {
        this.router = app;
    }

    routers (): express.Router[] {
        return [
        ];
    }
}

(() => { return new RegisterRoute(express.application).routers(); })();
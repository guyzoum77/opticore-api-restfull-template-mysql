import { oPTRegisterRouters, RoutersAppCore } from "opticore-core-module";

export const registerRouter = () => {
    const oPTRegister: oPTRegisterRouters = new oPTRegisterRouters();

    return oPTRegister.register([
    ]);
}
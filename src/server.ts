import "reflect-metadata";
import {Kernel} from "../app/core/kernel";
import {KernelModules} from "opticore-core-module";

(async(): Promise<void> => {
    const kernelLoaded = Kernel();
    console.log("kernelLoaded is :", kernelLoaded);
    await KernelModules(Kernel());
})();
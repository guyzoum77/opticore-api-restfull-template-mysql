import "reflect-metadata";
import {Kernel} from "../app/core/kernel";
import {KernelModules} from "opticore-core-module";

(async(): Promise<void> => { await KernelModules(Kernel); })();
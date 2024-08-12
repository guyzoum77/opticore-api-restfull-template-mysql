import "reflect-metadata";
import {Kernel} from "../app/core/kernel";
import {HttpStatusCodesConstant as status, LogMessageUtils} from "opticore-core-module";

export async function loadKernel() {
    try {
        await Promise.all(Kernel.map(loader => loader()));
        LogMessageUtils.success("Kernel", "load kernel", "All modules have been successfully loaded");
    } catch (error: any) {
        LogMessageUtils.error("Kernel", "load kernel", "all modules", "load all modules", "Fail to load all modules", error.message, status.INTERNAL_SERVER_ERROR);
        process.exit(1);
    }
}
(async() => { await loadKernel() })();
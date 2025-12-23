import { express, Response } from "opticore-express";
export declare class TestErrorController {
    private version;
    static testUncaughtException(res: Response): express.Response<any, Record<string, any>>;
    testUnhandledRejection(): Promise<void>;
    triggerError(errorType: string): void;
    getMessage(): string;
}

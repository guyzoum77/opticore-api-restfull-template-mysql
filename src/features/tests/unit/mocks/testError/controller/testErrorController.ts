// src/app/features/test/controllers/test-error.controller.ts


import { express, Request, Response, NextFunction } from "opticore-express";

export class TestErrorController {
    private version: number = 2;

    public static testUncaughtException(res: Response): express.Response<any, Record<string, any>> {
        // Décommentez pour tester
        // throw new Error("TEST: Uncaught exception - EventEmitters should catch this");
        console.log("Uncaught exception test - currently OK");
        return res.json({
            message: "all things are good",
            timestamp: new Date().toISOString(),
            instruction: 'Modify test-error.controller.ts and save to test hot reload'
        })
    }

    public async testUnhandledRejection(): Promise<void> {
        // Décommentez pour tester
        // return Promise.reject(new Error("TEST: Unhandled promise rejection"));
        console.log("Unhandled rejection test - currently OK");
    }

    public triggerError(errorType: string): void {
        console.log(`[TestErrorController] Triggering error: ${errorType}`);

        switch (errorType) {
            case 'uncaught':
                throw new Error("ORCHESTRATED: Uncaught exception for testing EventEmitters");

            case 'rejection':
                Promise.reject(new Error("ORCHESTRATED: Unhandled promise rejection"));
                break;

            case 'reference':
                // @ts-ignore
                console.log(thisVariableDoesNotExist);
                break;

            default:
                console.log(`Unknown error type: ${errorType}`);
        }
    }

    public getMessage(): string {
        return `Test Error Controller v${this.version}`;
    }
}
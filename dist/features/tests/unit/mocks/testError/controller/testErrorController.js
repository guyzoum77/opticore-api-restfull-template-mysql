"use strict";
// src/app/features/test/controllers/test-error.controller.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestErrorController = void 0;
class TestErrorController {
    version = 2;
    static testUncaughtException(res) {
        // Décommentez pour tester
        // throw new Error("TEST: Uncaught exception - EventEmitters should catch this");
        console.log("Uncaught exception test - currently OK");
        return res.json({
            message: "all things are good",
            timestamp: new Date().toISOString(),
            instruction: 'Modify test-error.controller.ts and save to test hot reload'
        });
    }
    async testUnhandledRejection() {
        // Décommentez pour tester
        // return Promise.reject(new Error("TEST: Unhandled promise rejection"));
        console.log("Unhandled rejection test - currently OK");
    }
    triggerError(errorType) {
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
    getMessage() {
        return `Test Error Controller v${this.version}`;
    }
}
exports.TestErrorController = TestErrorController;
//# sourceMappingURL=testErrorController.js.map
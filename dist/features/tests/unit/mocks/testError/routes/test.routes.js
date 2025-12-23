"use strict";
// src/app/features/test/routes/test.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const opticore_express_1 = require("opticore-express");
const testErrorController_1 = require("../controller/testErrorController");
const router = opticore_express_1.express.Router();
const testController = new testErrorController_1.TestErrorController();
// Route pour déclencher des erreurs
router.get('/test-error/:type', (req, res, next) => {
    const errorType = req.params.type;
    console.log(`[TestRoute] Error type requested: ${errorType}`);
    try {
        testController.triggerError(errorType);
        res.json({
            message: 'Error triggered',
            type: errorType,
            note: 'Check server logs for EventEmitter capture'
        });
    }
    catch (error) {
        // L'erreur sera transmise au middleware Express puis aux EventEmitters
        console.error(`[TestRoute] Error caught:`, error.message);
        next(error); // Important: passer au middleware d'erreur
    }
});
// Route pour vérifier le hot reload
router.get('/test-hot-reload', (req, res) => {
    const message = testController.getMessage();
    res.json({
        message,
        timestamp: new Date().toISOString(),
        instruction: 'Modify test-error.controller.ts and save to test hot reload'
    });
});
// Route pour obtenir les stats du serveur
router.get('/server-stats', (req, res) => {
    res.json({
        status: 'running',
        hotReload: 'active',
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
//# sourceMappingURL=test.routes.js.map
// src/app/features/test/routes/test.routes.ts

import { express, Request, Response, NextFunction } from "opticore-express";
import { TestErrorController } from "../controller/testErrorController";



const router = express.Router();
const testController = new TestErrorController();

// Route pour déclencher des erreurs
router.get('/test-error/:type', (req: Request, res: Response, next: NextFunction) => {
    const errorType = req.params.type;

    console.log(`[TestRoute] Error type requested: ${errorType}`);

    try {
        testController.triggerError(errorType);
        res.json({
            message: 'Error triggered',
            type: errorType,
            note: 'Check server logs for EventEmitter capture'
        });
    } catch (error: any) {
        // L'erreur sera transmise au middleware Express puis aux EventEmitters
        console.error(`[TestRoute] Error caught:`, error.message);
        next(error); // Important: passer au middleware d'erreur
    }
});

// Route pour vérifier le hot reload
router.get('/test-hot-reload', (req: Request, res: Response) => {
    const message = testController.getMessage();
    res.json({
        message,
        timestamp: new Date().toISOString(),
        instruction: 'Modify test-error.controller.ts and save to test hot reload'
    });
});

// Route pour obtenir les stats du serveur
router.get('/server-stats', (req: Request, res: Response) => {
    res.json({
        status: 'running',
        hotReload: 'active',
        timestamp: new Date().toISOString()
    });
});

export default router;
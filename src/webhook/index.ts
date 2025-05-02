import { Router } from "express";
import { WebhookEvent } from "../types";
import { webhookProcessor } from "./processor";

const router = Router();

router.post('/', async (req: any, res: any) => {
    const { body } = req;
    if (!body) {
        return res.status(400).send('No body');
    }
    const data: WebhookEvent = body;
    webhookProcessor(data)
    
});


export default router;
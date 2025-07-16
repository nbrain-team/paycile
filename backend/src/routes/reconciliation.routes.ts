import { Router } from 'express';
export const reconciliationRouter = Router();
reconciliationRouter.get('/', (req, res) => res.json({ reconciliations: [] }));

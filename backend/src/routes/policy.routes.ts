import { Router } from 'express';
export const policyRouter = Router();
policyRouter.get('/', (req, res) => res.json({ policies: [] }));

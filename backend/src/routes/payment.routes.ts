import { Router } from 'express';
export const paymentRouter = Router();
paymentRouter.get('/', (req, res) => res.json({ payments: [] }));

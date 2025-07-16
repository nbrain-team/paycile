import { Router } from 'express';
export const invoiceRouter = Router();
invoiceRouter.get('/', (req, res) => res.json({ invoices: [] }));

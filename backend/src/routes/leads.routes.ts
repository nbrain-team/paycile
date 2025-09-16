import express, { Request, Response } from 'express';
import { query } from '../config/database';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

async function ensureLeadsTable() {
  await query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      session_id TEXT,
      source TEXT,
      name TEXT,
      email TEXT,
      phone TEXT,
      basis TEXT,
      volume NUMERIC,
      transactions INTEGER,
      fees NUMERIC,
      mcc_category TEXT,
      avg_ticket NUMERIC,
      current_eff_rate NUMERIC,
      proposed_eff_rate NUMERIC,
      savings_dollars NUMERIC,
      rate_delta NUMERIC,
      transcript JSONB
    );
    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
  `);
}

router.post('/start', async (req: Request, res: Response) => {
  try {
    await ensureLeadsTable();
    const { sessionId, source, initial } = req.body as { sessionId?: string; source?: string; initial?: any };
    const r = await query(
      `INSERT INTO leads (session_id, source, basis, volume, transactions, fees, mcc_category, transcript)
       VALUES ($1, COALESCE($2, 'public_chat'), $3, $4, $5, $6, $7, $8)
       RETURNING id, created_at`,
      [
        sessionId ?? null,
        source ?? 'public_chat',
        initial?.basis ?? null,
        initial?.volume ?? null,
        initial?.transactions ?? null,
        initial?.fees ?? null,
        initial?.mccCategory ?? null,
        initial?.transcript ? JSON.stringify(initial.transcript) : null
      ]
    );
    res.json({ success: true, data: r.rows[0] });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message || 'Failed to start lead' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    await ensureLeadsTable();
    const { id } = req.params;
    const {
      name, email, phone, basis, volume, transactions, fees, mccCategory,
      avgTicket, currentEffRate, proposedEffRate, savingsDollars, rateDelta,
      transcript
    } = req.body as any;

    const r = await query(
      `UPDATE leads SET
         name = COALESCE($2, name),
         email = COALESCE($3, email),
         phone = COALESCE($4, phone),
         basis = COALESCE($5, basis),
         volume = COALESCE($6, volume),
         transactions = COALESCE($7, transactions),
         fees = COALESCE($8, fees),
         mcc_category = COALESCE($9, mcc_category),
         avg_ticket = COALESCE($10, avg_ticket),
         current_eff_rate = COALESCE($11, current_eff_rate),
         proposed_eff_rate = COALESCE($12, proposed_eff_rate),
         savings_dollars = COALESCE($13, savings_dollars),
         rate_delta = COALESCE($14, rate_delta),
         transcript = COALESCE($15, transcript),
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        name ?? null,
        email ?? null,
        phone ?? null,
        basis ?? null,
        volume ?? null,
        transactions ?? null,
        fees ?? null,
        mccCategory ?? null,
        avgTicket ?? null,
        currentEffRate ?? null,
        proposedEffRate ?? null,
        savingsDollars ?? null,
        rateDelta ?? null,
        transcript ? JSON.stringify(transcript) : null
      ]
    );

    if (r.rowCount === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: r.rows[0] });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message || 'Failed to update lead' });
  }
});

// Authenticated listing for logged-in users
router.get('/', authenticateToken, async (_req: Request, res: Response) => {
  try {
    await ensureLeadsTable();
    const r = await query('SELECT * FROM leads ORDER BY created_at DESC LIMIT 500');
    res.json({ success: true, data: r.rows });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message || 'Failed to list leads' });
  }
});

router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    await ensureLeadsTable();
    const { id } = req.params;
    const r = await query('SELECT * FROM leads WHERE id = $1', [id]);
    if (r.rowCount === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: r.rows[0] });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message || 'Failed to fetch lead' });
  }
});

export { router as leadsRouter };



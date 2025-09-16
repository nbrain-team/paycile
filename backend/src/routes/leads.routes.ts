import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const leadsFile = path.resolve(__dirname, '../../leads.jsonl');

type Lead = {
  id: string;
  created_at: string;
  updated_at: string;
  session_id?: string | null;
  source?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  basis?: string | null;
  volume?: number | null;
  transactions?: number | null;
  fees?: number | null;
  mcc_category?: string | null;
  avg_ticket?: number | null;
  current_eff_rate?: number | null;
  proposed_eff_rate?: number | null;
  savings_dollars?: number | null;
  rate_delta?: number | null;
  transcript?: any;
};

function readAllLeads(): Lead[] {
  if (!fs.existsSync(leadsFile)) return [];
  const raw = fs.readFileSync(leadsFile, 'utf8');
  return raw
    .split(/\n/)
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => { try { return JSON.parse(l); } catch { return null as any; } })
    .filter(Boolean);
}

function writeAllLeads(leads: Lead[]) {
  const data = leads.map(l => JSON.stringify(l)).join('\n') + '\n';
  fs.writeFileSync(leadsFile, data, 'utf8');
}

router.post('/start', async (req: Request, res: Response) => {
  try {
    const { sessionId, source, initial } = req.body as { sessionId?: string; source?: string; initial?: any };
    const now = new Date().toISOString();
    const lead: Lead = {
      id: uuidv4(),
      created_at: now,
      updated_at: now,
      session_id: sessionId ?? null,
      source: source ?? 'public_chat',
      basis: initial?.basis ?? null,
      volume: initial?.volume ?? null,
      transactions: initial?.transactions ?? null,
      fees: initial?.fees ?? null,
      mcc_category: initial?.mccCategory ?? null,
      transcript: initial?.transcript ?? null,
      name: null,
      email: null,
      phone: null,
      avg_ticket: null,
      current_eff_rate: null,
      proposed_eff_rate: null,
      savings_dollars: null,
      rate_delta: null,
    };
    const all = readAllLeads();
    all.unshift(lead);
    writeAllLeads(all);
    res.json({ success: true, data: { id: lead.id, created_at: lead.created_at } });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message || 'Failed to start lead' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body as Partial<Lead> & { mccCategory?: string; avgTicket?: number; currentEffRate?: number; proposedEffRate?: number; savingsDollars?: number; rateDelta?: number };
    const all = readAllLeads();
    const idx = all.findIndex(l => l.id === id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Not found' });
    const now = new Date().toISOString();
    const patched: Lead = {
      ...all[idx],
      updated_at: now,
      name: body.name ?? all[idx].name ?? null,
      email: body.email ?? all[idx].email ?? null,
      phone: body.phone ?? all[idx].phone ?? null,
      basis: body.basis ?? all[idx].basis ?? null,
      volume: (body as any).volume ?? all[idx].volume ?? null,
      transactions: (body as any).transactions ?? all[idx].transactions ?? null,
      fees: (body as any).fees ?? all[idx].fees ?? null,
      mcc_category: (body as any).mccCategory ?? all[idx].mcc_category ?? null,
      avg_ticket: (body as any).avgTicket ?? all[idx].avg_ticket ?? null,
      current_eff_rate: (body as any).currentEffRate ?? all[idx].current_eff_rate ?? null,
      proposed_eff_rate: (body as any).proposedEffRate ?? all[idx].proposed_eff_rate ?? null,
      savings_dollars: (body as any).savingsDollars ?? all[idx].savings_dollars ?? null,
      rate_delta: (body as any).rateDelta ?? all[idx].rate_delta ?? null,
      transcript: body.transcript ?? all[idx].transcript ?? null,
    };
    all[idx] = patched;
    writeAllLeads(all);
    res.json({ success: true, data: patched });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message || 'Failed to update lead' });
  }
});

// Public listing endpoint (protect via network rules if needed)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const list = readAllLeads();
    res.json({ success: true, data: list });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message || 'Failed to list leads' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const list = readAllLeads();
    const found = list.find(l => l.id === id);
    if (!found) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: found });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message || 'Failed to fetch lead' });
  }
});

export { router as leadsRouter };



import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

type ExtractResponse = {
  volume: number;
  transactions: number;
  fees: number;
  sources: { page: number; text: string }[];
};

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg'
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported file type'));
  }
});

// Category rates are now managed via flat file cat-rates.csv
const catRatesPath = path.resolve(__dirname, '../../cat-rates.csv');
let catRatesCache: Array<{ id: string; name: string; rate_percent: number; is_active: boolean }> | null = null;
function loadCategoryRatesFromCsv() {
  try {
    const raw = fs.readFileSync(catRatesPath, 'utf8');
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const items: Array<{ id: string; name: string; rate_percent: number; is_active: boolean }> = [];
    for (const line of lines) {
      if (line.startsWith('#')) continue;
      const [nameCol, rateCol, activeCol] = line.split(',').map(s => s?.trim());
      if (!nameCol || !rateCol) continue;
      const rate = parseFloat(rateCol.replace(/%/g, ''));
      const isActive = (activeCol ?? 'true').toLowerCase() !== 'false';
      if (Number.isNaN(rate)) continue;
      items.push({ id: uuidv4(), name: nameCol, rate_percent: rate, is_active: isActive });
    }
    catRatesCache = items;
  } catch (e) {
    catRatesCache = [];
  }
}
function ensureCatRatesLoaded() {
  if (!catRatesCache) loadCategoryRatesFromCsv();
}
function findRateByCategory(name?: string): number | undefined {
  if (!name) return undefined;
  ensureCatRatesLoaded();
  const n = (name || '').toLowerCase();
  const item = (catRatesCache || []).find(i => i.name.toLowerCase() === n);
  return item ? item.rate_percent : undefined;
}

// Normalize category name
function normalizeCategoryName(name: string): string {
  return name.trim();
}

router.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  const file = (req as any).file as { path: string; originalname: string; size: number } | undefined;
  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  const fileId = path.basename(file.path);
  res.json({ fileId, filename: file.originalname, size: file.size });
});

router.post('/extract', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.body as { fileId?: string };
    if (!fileId) {
      res.status(400).json({ error: 'fileId is required' });
      return;
    }

    const filePath = path.join(uploadsDir, fileId);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    let text = '';

    if (ext === '.pdf') {
      const data = await pdfParse(fs.readFileSync(filePath));
      text = data.text || '';
    } else if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
      // Image OCR not implemented to avoid heavy deps; ask user if needed
      res.status(415).json({ error: 'Image OCR not enabled. Please upload a PDF statement.' });
      return;
    } else {
      res.status(415).json({ error: 'Unsupported file extension' });
      return;
    }

    const result = extractTotalsFromText(text);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to extract totals' });
  }
});

router.post('/calc', (req: Request, res: Response) => {
  const { volume, transactions, fees, mccCategory } = req.body as {
    volume?: number;
    transactions?: number;
    fees?: number;
    mccCategory?: string;
  };

  if (!volume || !transactions || !fees) {
    res.status(400).json({ error: 'volume, transactions, and fees are required' });
    return;
  }

  // cents-safe math
  const volumeCents = Math.round(volume * 100);
  const feesCents = Math.round(fees * 100);

  const avgTicketCents = Math.floor(volumeCents / transactions);
  const avgTicket = avgTicketCents / 100;

  const currentEffRate = (feesCents / volumeCents) * 100;

  // Default rate if no category match (based on avg ticket)
  let proposedRateDecimal: number | null = null;
  (async () => {
    if (mccCategory) {
      try {
        const ratePercent = findRateByCategory(mccCategory);
        if (typeof ratePercent === 'number') {
          proposedRateDecimal = ratePercent / 100.0;
        }
      } catch {
        // ignore and fall back
      }
    }
    if (proposedRateDecimal === null) {
      if (avgTicket >= 500) proposedRateDecimal = 0.0220;
      else if (avgTicket >= 250) proposedRateDecimal = 0.0250;
      else proposedRateDecimal = 0.0240;
    }

    const proposedEffRate = proposedRateDecimal * 100;
    const savingsDollars = (currentEffRate / 100 - proposedRateDecimal) * (volumeCents / 100);
    const rateDelta = proposedEffRate - currentEffRate;

    res.json({
      avgTicket,
      currentEffRate,
      proposedEffRate,
      savingsDollars,
      rateDelta
    });
  })();
});

router.post('/calc-advanced', (req: Request, res: Response) => {
  const {
    basis,
    totalVolume,
    totalTransactions,
    totalFees,
    perCard,
    mcc,
    monthlyFixedFees,
    perTxnFee
  } = req.body as {
    basis?: 'monthly' | 'annual';
    totalVolume?: number;
    totalTransactions?: number;
    totalFees?: number;
    perCard?: {
      visa?: { volume?: number; transactions?: number };
      mc?: { volume?: number; transactions?: number };
      discover?: { volume?: number; transactions?: number };
      amex?: { volume?: number; transactions?: number };
    };
    mcc?: string;
    monthlyFixedFees?: number;
    perTxnFee?: number;
  };

  if (!totalVolume || !totalTransactions || !totalFees) {
    res.status(400).json({ error: 'totalVolume, totalTransactions, and totalFees are required' });
    return;
  }

  const inputBasis: 'monthly' | 'annual' = basis === 'annual' ? 'annual' : 'monthly';
  const monthsInPeriod = inputBasis === 'annual' ? 12 : 1;
  const volume = totalVolume;
  const transactions = totalTransactions;
  const fees = totalFees;
  const fixedFeesMonthly = Math.max(0, monthlyFixedFees ?? 0);
  const perTransactionFee = Math.max(0, perTxnFee ?? 0);

  // MCC-based base interchange averages (as decimal)
  // Values provided by client email; structure allows future expansion by MCC
  const baseByMCC: Record<string, { visa: number; mc: number; discover: number; amex: number }> = {
    propane: { visa: 0.0210, mc: 0.0210, discover: 0.0210, amex: 0.0220 },
    '5983': { visa: 0.0210, mc: 0.0210, discover: 0.0210, amex: 0.0220 },
    '4900': { visa: 0.0210, mc: 0.0210, discover: 0.0210, amex: 0.0220 },
    insurance: { visa: 0.0210, mc: 0.0210, discover: 0.0210, amex: 0.0220 },
    '5960': { visa: 0.0210, mc: 0.0210, discover: 0.0210, amex: 0.0220 },
    '6300': { visa: 0.0210, mc: 0.0210, discover: 0.0210, amex: 0.0220 },
    real_estate: { visa: 0.0210, mc: 0.0210, discover: 0.0210, amex: 0.0220 },
    '6513': { visa: 0.0210, mc: 0.0210, discover: 0.0210, amex: 0.0220 },
    default: { visa: 0.0210, mc: 0.0210, discover: 0.0210, amex: 0.0220 }
  };

  const base = baseByMCC[mcc ?? ''] ?? baseByMCC.default;

  // Card mix handling
  const vVisa = Math.max(0, perCard?.visa?.volume ?? 0);
  const vMC = Math.max(0, perCard?.mc?.volume ?? 0);
  const vDisc = Math.max(0, perCard?.discover?.volume ?? 0);
  const vAmex = Math.max(0, perCard?.amex?.volume ?? 0);
  const volSum = vVisa + vMC + vDisc + vAmex;
  const usePerCard = volSum > 0 && Math.abs(volSum - volume) < Math.max(50, volume * 0.01);

  const cardMix = usePerCard ? {
    visa: vVisa / volSum,
    mc: vMC / volSum,
    discover: vDisc / volSum,
    amex: vAmex / volSum,
  } : {
    // If no breakdown, assume Visa-heavy mix as conservative default
    visa: 0.6,
    mc: 0.3,
    discover: 0.05,
    amex: 0.05,
  };

  const weightedBaseRate = base.visa * cardMix.visa + base.mc * cardMix.mc + base.discover * cardMix.discover + base.amex * cardMix.amex;

  const perTxnCost = perTransactionFee * transactions;
  const fixedFeesForPeriod = fixedFeesMonthly * monthsInPeriod;

  const proposedRateDecimal = weightedBaseRate + (perTxnCost + fixedFeesForPeriod) / volume;

  const avgTicket = volume / transactions;
  const currentEffRate = (fees / volume) * 100;
  const proposedEffRate = proposedRateDecimal * 100;
  const savingsDollars = (currentEffRate / 100 - proposedRateDecimal) * volume;
  const rateDelta = proposedEffRate - currentEffRate;

  const monthlySavings = inputBasis === 'monthly' ? savingsDollars : savingsDollars / 12;
  const annualSavings = monthlySavings * 12;
  const threeYearSavings = annualSavings * 3;
  const fiveYearSavings = annualSavings * 5;

  // Fee recovery program: recover ~90% of current fees (illustrative)
  const monthlyFees = inputBasis === 'monthly' ? fees : fees / 12;
  const feeRecoveryMonthly = monthlyFees * 0.90;
  const feeRecoveryAnnual = feeRecoveryMonthly * 12;

  res.json({
    avgTicket,
    currentEffRate,
    proposedEffRate,
    savingsDollars,
    rateDelta,
    horizons: {
      monthly: monthlySavings,
      annual: annualSavings,
      threeYear: threeYearSavings,
      fiveYear: fiveYearSavings,
    },
    feeRecovery: {
      monthly: feeRecoveryMonthly,
      annual: feeRecoveryAnnual,
      threeYear: feeRecoveryAnnual * 3,
      fiveYear: feeRecoveryAnnual * 5,
    },
    assumptions: {
      mcc: mcc || 'default',
      baseRates: base,
      cardMix,
      usedPerCardMix: usePerCard,
      perTxnFee: perTransactionFee,
      monthlyFixedFees: fixedFeesMonthly,
      basis: inputBasis,
    }
  });
});

function extractTotalsFromText(rawText: string): ExtractResponse {
  const normalized = rawText
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/USD\s*/gi, '$');

  // Build lines with pseudo page numbers if form-feed not present
  const pages = normalized.split('\f');
  const linesWithPages: { page: number; text: string }[] = [];
  pages.forEach((pageText, index) => {
    const page = index + 1;
    pageText.split(/\r?\n/).forEach(line => {
      const trimmed = line.replace(/\s+/g, ' ').trim();
      if (trimmed) linesWithPages.push({ page, text: trimmed });
    });
  });

  // Expanded keyword sets from common processors
  const volumeKeywords = [
    'net sales volume', 'net sales', 'sales volume', 'total volume',
    'amounts submitted', 'amount submitted', 'total sales', 'gross sales',
    'deposit amount', 'total submitted', 'settlement total'
  ];
  const feesKeywords = [
    'fees charged', 'total fees', 'processing fees', 'total processing costs',
    'total processing fee', 'discount fees', 'total charges', 'fees this period',
    'processing charges', 'discount rate', 'interchange fees', 'assessment fees'
  ];
  const txnKeywords = [
    'number of transactions', 'total transactions', 'transaction count',
    'total txn', 'txn count', '# of transactions', 'transactions'
  ];

  // Money amounts: allow parentheses for negatives and optional decimals
  const moneyRegex = /\(\s*\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)\s*\)|\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)/g;
  const intRegex = /\b([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\b/;

  type Candidate = { value: number; score: number; source: { page: number; text: string } };

  function toNumber(str: string): number {
    return parseFloat(str.replace(/[,]/g, ''));
  }

  function extractMoney(line: string): number[] {
    const values: number[] = [];
    let m: RegExpExecArray | null;
    moneyRegex.lastIndex = 0;
    while ((m = moneyRegex.exec(line)) !== null) {
      const raw = m[1] ?? m[2];
      if (raw === undefined) continue;
      const v = toNumber(raw);
      if (!Number.isNaN(v)) {
        // Parentheses indicate negative; capture group 1 corresponds to paren match
        const negative = !!m[1] && m[0].trim().startsWith('(');
        values.push(negative ? -v : v);
      }
    }
    return values;
  }

  function extractInt(line: string): number[] {
    const values: number[] = [];
    const cleaned = line.replace(/[,]/g, '');
    const matches = cleaned.match(/\b\d+\b/g);
    if (matches) {
      matches.forEach(s => {
        const v = parseInt(s, 10);
        if (!Number.isNaN(v)) values.push(v);
      });
    }
    return values;
  }

  function getNeighborhood(idx: number, radius: number): { page: number; text: string }[] {
    const start = Math.max(0, idx - radius);
    const end = Math.min(linesWithPages.length - 1, idx + radius);
    return linesWithPages.slice(start, end + 1);
  }

  function scoreLineForVolume(text: string): number {
    const t = text.toLowerCase();
    let s = 0;
    if (t.includes('total')) s += 2;
    if (t.includes('net')) s += 2;
    if (t.includes('sales') || t.includes('submitted') || t.includes('volume')) s += 2;
    if (t.includes('gross')) s += 1;
    return s;
  }

  function scoreLineForFees(text: string, hasNegativeAmount: boolean): number {
    const t = text.toLowerCase();
    let s = 0;
    if (t.includes('total')) s += 2;
    if (t.includes('fee') || t.includes('charge')) s += 3;
    if (t.includes('processing') || t.includes('discount') || t.includes('interchange')) s += 1;
    if (hasNegativeAmount) s += 2; // many statements show fees as negatives (parentheses)
    return s;
  }

  function scoreLineForTxn(text: string): number {
    const t = text.toLowerCase();
    let s = 0;
    if (t.includes('total')) s += 2;
    if (t.includes('transaction') || t.includes('txn')) s += 3;
    if (t.includes('count') || t.includes('#')) s += 1;
    return s;
  }

  function findBestCandidate(
    keywords: string[],
    expect: 'money' | 'int',
    scorer: (text: string, hasNegative?: boolean) => number,
    preferMax = false
  ): Candidate | null {
    const candidates: Candidate[] = [];
    for (let i = 0; i < linesWithPages.length; i += 1) {
      const lp = linesWithPages[i];
      const lower = lp.text.toLowerCase();
      if (!keywords.some(k => lower.includes(k))) continue;

      const neighborhood = getNeighborhood(i, 2);
      neighborhood.forEach(nl => {
        if (expect === 'money') {
          const vals = extractMoney(nl.text);
          vals.forEach(v => {
            const hasNeg = v < 0 || /\(|-/.test(nl.text);
            const score = scorer(nl.text, hasNeg) + (nl.text.toLowerCase().includes('total') ? 1 : 0);
            candidates.push({ value: Math.abs(v), score, source: nl });
          });
        } else {
          const ints = extractInt(nl.text);
          ints.forEach(v => {
            const score = scorer(nl.text);
            candidates.push({ value: v, score, source: nl });
          });
        }
      });
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => (b.score - a.score) || (preferMax ? b.value - a.value : 0));
    return candidates[0];
  }

  // Helper: extract first money value from a specific line
  function firstMoneyFromLine(line: { page: number; text: string }): Candidate | null {
    const vals = extractMoney(line.text);
    if (vals.length === 0) return null;
    return { value: Math.abs(vals[0]), score: 10, source: line };
  }

  // Helper: look ahead a few lines to find the first money value
  function firstMoneyFromFollowingLines(startIdx: number, maxLookahead = 3): Candidate | null {
    for (let i = startIdx + 1; i <= Math.min(startIdx + maxLookahead, linesWithPages.length - 1); i += 1) {
      const cand = firstMoneyFromLine(linesWithPages[i]);
      if (cand) return { ...cand, score: cand.score + 2 };
    }
    return null;
  }

  // 0) Targeted direct matches with strong precedence
  const directVolumeIdx = linesWithPages.findIndex(lp => /\bamounts? submitted\b/i.test(lp.text));
  const directFeesIdx = linesWithPages.findIndex(lp => /\bfees charged\b/i.test(lp.text));

  const volumeDirect = directVolumeIdx >= 0
    ? (firstMoneyFromLine(linesWithPages[directVolumeIdx]) ?? firstMoneyFromFollowingLines(directVolumeIdx, 4))
    : null;
  const feesDirect = directFeesIdx >= 0
    ? (firstMoneyFromLine(linesWithPages[directFeesIdx]) ?? firstMoneyFromFollowingLines(directFeesIdx, 4))
    : null;

  // 1) Generic candidates (only if not directly found)
  const volumeCand = volumeDirect ?? findBestCandidate(volumeKeywords, 'money', scoreLineForVolume, true);
  // Special finder for fees: prefer negative amounts when present
  function findBestFeesCandidate(): Candidate | null {
    const candidates: (Candidate & { negative: boolean })[] = [];
    for (let i = 0; i < linesWithPages.length; i += 1) {
      const lp = linesWithPages[i];
      const lower = lp.text.toLowerCase();
      if (!feesKeywords.some(k => lower.includes(k))) continue;
      const hood = getNeighborhood(i, 2);
      hood.forEach(nl => {
        const vals = extractMoney(nl.text);
        vals.forEach(v => {
          const neg = /\(|-/.test(nl.text);
          const score = scoreLineForFees(nl.text, neg) + (/(^|\s)total(\s|$)/i.test(nl.text) ? 1 : 0);
          candidates.push({ value: Math.abs(v), score, source: nl, negative: neg });
        });
      });
    }
    if (candidates.length === 0) return null;
    const negatives = candidates.filter(c => c.negative);
    if (negatives.length > 0) {
      negatives.sort((a, b) => (b.score - a.score) || (b.value - a.value));
      const { negative, ...rest } = negatives[0];
      return rest;
    }
    candidates.sort((a, b) => (b.score - a.score));
    const { negative, ...rest } = candidates[0];
    return rest;
  }

  const feesCand = feesDirect ?? findBestFeesCandidate();

  // For transactions, avoid treating currency as counts
  function extractNonMoneyInts(line: string): number[] {
    const moneySpans: Array<{ start: number; end: number }> = [];
    let m: RegExpExecArray | null;
    moneyRegex.lastIndex = 0;
    while ((m = moneyRegex.exec(line)) !== null) {
      moneySpans.push({ start: m.index, end: m.index + m[0].length });
    }
    const results: number[] = [];
    const re = /\b\d{1,9}\b/g; // integer blocks in original string
    let x: RegExpExecArray | null;
    while ((x = re.exec(line)) !== null) {
      const start = x.index;
      const end = start + x[0].length;
      // Skip if inside a money span
      const overlapsMoney = moneySpans.some(s => !(end <= s.start || start >= s.end));
      if (overlapsMoney) continue;
      // Skip if adjacent to a decimal point (part of 4.75)
      const before = start > 0 ? line[start - 1] : '';
      const after = end < line.length ? line[end] : '';
      if (before === '.' || after === '.') continue;
      const v = parseInt(x[0].replace(/[,]/g, ''), 10);
      if (!Number.isNaN(v)) results.push(v);
    }
    return results;
  }
  function findTxnCandidate(): Candidate | null {
    const candidates: Candidate[] = [];
    for (let i = 0; i < linesWithPages.length; i += 1) {
      const lp = linesWithPages[i];
      const lower = lp.text.toLowerCase();
      if (!txnKeywords.some(k => lower.includes(k))) continue;
      const hood = getNeighborhood(i, 2);
      hood.forEach(nl => {
        extractNonMoneyInts(nl.text).forEach(v => {
          const score = scoreLineForTxn(nl.text) + (/(^|\s)total(\s|$)/i.test(nl.text) ? 1 : 0);
          candidates.push({ value: v, score, source: nl });
        });
      });
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => (b.score - a.score) || (b.value - a.value));
    return candidates[0];
  }
  // Transactions: target known patterns FIRST
  let txnFinal: Candidate | null = null;

  // A) SUMMARY BY CARD TYPE → "Total1,083$..."
  {
    const summaryByCardIdx = linesWithPages.findIndex(lp => lp.text.toLowerCase().includes('summary by card type'));
    if (summaryByCardIdx !== -1) {
      for (let i = summaryByCardIdx; i < Math.min(summaryByCardIdx + 80, linesWithPages.length); i += 1) {
        const compact = linesWithPages[i].text.replace(/\s+/g, '');
        const m = /^Total([0-9]{1,3}(?:,[0-9]{3})*)(?:\$|$)/.exec(compact);
        if (m) {
          const count = parseInt(m[1].replace(/[,]/g, ''), 10);
          if (!Number.isNaN(count)) {
            txnFinal = { value: count, score: 10, source: linesWithPages[i] };
            break;
          }
        }
      }
    }
  }

  // B) End summary line → "TOTAL $563,237.04 1,083 ..."
  if (!txnFinal) {
    const endTotalMatch = /\bTOTAL\s*\$\s*[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?\s*([0-9]{1,3}(?:,[0-9]{3})*)/i.exec(normalized.replace(/\s+/g, ' '));
    if (endTotalMatch) {
      const count = parseInt(endTotalMatch[1].replace(/[,]/g, ''), 10);
      if (!Number.isNaN(count)) {
        const src = linesWithPages.find(lp => /TOTAL/i.test(lp.text)) ?? linesWithPages[0];
        txnFinal = { value: count, score: 8, source: src };
      }
    }
  }

  // C) Generic as last resort
  let txnCand = txnFinal ? null : findTxnCandidate();

  // Fallbacks: try generic patterns across all lines
  function fallbackMoneyByLabel(labels: string[]): Candidate | null {
    const all: Candidate[] = [];
    linesWithPages.forEach(lp => {
      labels.forEach(lbl => {
        const idx = lp.text.toLowerCase().indexOf(lbl);
        if (idx >= 0) {
          const vals = extractMoney(lp.text);
          vals.forEach(v => all.push({ value: Math.abs(v), score: 1, source: lp }));
        }
      });
    });
    if (all.length === 0) return null;
    all.sort((a, b) => b.value - a.value);
    return all[0];
  }

  function fallbackIntByLabel(labels: string[]): Candidate | null {
    const all: Candidate[] = [];
    linesWithPages.forEach(lp => {
      labels.forEach(lbl => {
        if (lp.text.toLowerCase().includes(lbl)) {
          extractInt(lp.text).forEach(v => all.push({ value: v, score: 1, source: lp }));
        }
      });
    });
    if (all.length === 0) return null;
    all.sort((a, b) => b.value - a.value);
    return all[0];
  }

  const volumeFinal = volumeCand ?? fallbackMoneyByLabel(['volume', 'sales', 'submitted'])
    ?? undefined;
  const feesFinal = feesCand ?? fallbackMoneyByLabel(['fees', 'charges', 'discount'])
    ?? undefined;
  txnFinal = txnFinal ?? txnCand ?? fallbackIntByLabel(['transaction', 'txn', 'count']) ?? null;

  // (previous targeted heuristics moved above and now prioritized)

  const txnResolved = txnFinal ?? undefined;

  if (!volumeFinal || !feesFinal || !txnResolved) {
    throw new Error('Could not reliably extract totals from the statement');
  }

  const volume = volumeFinal.value;
  const fees = feesFinal.value;
  const transactions = Math.floor(txnResolved.value);

  const sources: { page: number; text: string }[] = [
    volumeFinal.source,
    feesFinal.source,
    txnResolved.source
  ];

  return { volume, transactions, fees, sources };
}

export { router as feesRouter };

// Admin endpoints for category rates
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    ensureCatRatesLoaded();
    res.json({ success: true, data: catRatesCache || [] });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message || 'Failed to fetch categories' });
  }
});

router.post('/categories', async (_req: Request, res: Response) => {
  res.status(405).json({ success: false, error: 'Categories are managed via cat-rates.csv' });
});

router.put('/categories/:id', async (_req: Request, res: Response) => {
  res.status(405).json({ success: false, error: 'Categories are managed via cat-rates.csv' });
});

router.delete('/categories/:id', async (_req: Request, res: Response) => {
  res.status(405).json({ success: false, error: 'Categories are managed via cat-rates.csv' });
});

// CSV upload: two columns: name, ratePercent
router.post('/categories/upload-csv', upload.single('file'), async (_req: Request, res: Response) => {
  res.status(405).json({ success: false, error: 'Categories are managed via cat-rates.csv' });
});



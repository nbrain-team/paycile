import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pdfParse from 'pdf-parse';

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
  const { volume, transactions, fees } = req.body as {
    volume?: number;
    transactions?: number;
    fees?: number;
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

  let proposedRateDecimal: number;
  if (avgTicket >= 500) proposedRateDecimal = 0.0220;
  else if (avgTicket >= 250) proposedRateDecimal = 0.0250;
  else proposedRateDecimal = 0.0240;

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

  const volumeCand = findBestCandidate(volumeKeywords, 'money', scoreLineForVolume, true);
  const feesCand = findBestCandidate(feesKeywords, 'money', scoreLineForFees, false);
  const txnCand = findBestCandidate(txnKeywords, 'int', scoreLineForTxn, true);

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
  let txnFinal = txnCand ?? fallbackIntByLabel(['transaction', 'txn', 'count']) ?? null;

  // Extra heuristics for statements like the provided sample:
  // 1) In "SUMMARY BY CARD TYPE" table, a line like: "Total1,083$563,237.0400.00$563,237.04"
  //    The first integer after "Total" is item count.
  if (!txnFinal) {
    const summaryByCardIdx = linesWithPages.findIndex(lp => lp.text.toLowerCase().includes('summary by card type'));
    if (summaryByCardIdx !== -1) {
      for (let i = summaryByCardIdx; i < Math.min(summaryByCardIdx + 50, linesWithPages.length); i += 1) {
        const line = linesWithPages[i].text.replace(/\s+/g, '');
        const m = /^Total([0-9]{1,3}(?:,[0-9]{3})*)(?:\$|$)/.exec(line);
        if (m) {
          const count = parseInt(m[1].replace(/[,]/g, ''), 10);
          if (!Number.isNaN(count)) {
            txnFinal = { value: count, score: 5, source: linesWithPages[i] };
            break;
          }
        }
      }
    }
  }

  // 2) End-of-report TOTAL line like: "TOTAL$563,237.041,083-..." → extract the integer after the money
  if (!txnFinal) {
    const endTotalMatch = /\bTOTAL\s*\$\s*[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?\s*([0-9]{1,3}(?:,[0-9]{3})*)/i.exec(normalized.replace(/\s+/g, ' '));
    if (endTotalMatch) {
      const count = parseInt(endTotalMatch[1].replace(/[,]/g, ''), 10);
      if (!Number.isNaN(count)) {
        // find a nearby source line for traceability
        const src = linesWithPages.find(lp => /TOTAL/i.test(lp.text));
        txnFinal = { value: count, score: 4, source: src ?? linesWithPages[0] };
      }
    }
  }

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



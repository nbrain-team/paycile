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

function extractTotalsFromText(text: string): ExtractResponse {
  const pages = text.split('\f');
  const linesWithPages: { page: number; text: string }[] = [];
  pages.forEach((pageText, index) => {
    const page = index + 1;
    pageText.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (trimmed) linesWithPages.push({ page, text: trimmed });
    });
  });

  const volumeKeywords = [
    'net sales volume',
    'amounts submitted',
    'net sales',
    'sales volume',
    'total volume'
  ];
  const feesKeywords = [
    'fees charged',
    'total fees',
    'processing fees',
    'total processing costs',
    'total processing fee',
    'discount fees'
  ];
  const txnKeywords = [
    'number of transactions',
    'total transactions',
    'transactions',
    'txn count'
  ];

  const amountRegex = /\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+(?:\.[0-9]{2}))/g;
  const intRegex = /\b([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\b/;

  function findByKeywords(keywords: string[], preferMax = false): { value: number; source: { page: number; text: string } } | null {
    const candidates: { value: number; source: { page: number; text: string } }[] = [];
    linesWithPages.forEach(lp => {
      const lower = lp.text.toLowerCase();
      if (keywords.some(k => lower.includes(k))) {
        let match;
        const values: number[] = [];
        while ((match = amountRegex.exec(lp.text)) !== null) {
          const v = parseFloat(match[1].replace(/,/g, ''));
          if (!Number.isNaN(v)) values.push(v);
        }
        if (values.length === 0) {
          const im = intRegex.exec(lp.text.replace(/[,]/g, ''));
          if (im) {
            const v = parseFloat(im[1]);
            if (!Number.isNaN(v)) values.push(v);
          }
        }
        values.forEach(v => candidates.push({ value: v, source: lp }));
      }
    });
    if (candidates.length === 0) return null;
    return preferMax
      ? candidates.reduce((a, b) => (b.value > a.value ? b : a))
      : candidates[0];
  }

  const volumeCandidate = findByKeywords(volumeKeywords, true);
  const feesCandidate = findByKeywords(feesKeywords, false);
  const txnCandidate = findByKeywords(txnKeywords, true);

  if (!volumeCandidate || !feesCandidate || !txnCandidate) {
    throw new Error('Could not reliably extract totals from the statement');
  }

  const volume = volumeCandidate.value;
  const fees = feesCandidate.value;
  const transactions = Math.floor(txnCandidate.value);

  const sources: { page: number; text: string }[] = [
    volumeCandidate.source,
    feesCandidate.source,
    txnCandidate.source
  ];

  return { volume, transactions, fees, sources };
}

export { router as feesRouter };



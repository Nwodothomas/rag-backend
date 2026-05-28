import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import multer from 'multer';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { config } from '../utils/config.js';
import type { DocumentKind, FileRecord } from '../utils/types.js';
import { saveUpload } from '../services/supabaseClient.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const supportedKinds: DocumentKind[] = ['pdf', 'docx', 'xls', 'video', 'url'];

function assertDocumentKind(value: string): DocumentKind {
  if (supportedKinds.includes(value as DocumentKind)) {
    return value as DocumentKind;
  }

  throw new Error(`Unsupported upload type: ${value}`);
}

async function handleBinaryUpload(kind: DocumentKind, file: Express.Multer.File, uploadedBy: string): Promise<FileRecord> {
  const storagePath = `${kind}/${Date.now()}-${randomUUID()}-${file.originalname}`;
  return saveUpload({
    kind,
    buffer: file.buffer,
    metadata: {
      sourceName: file.originalname,
      mimeType: file.mimetype || 'application/octet-stream',
      size: file.size,
      uploadedBy,
      storagePath,
      bucket: config.uploadBucket,
    },
  });
}

router.post('/:kind(pdf|docx|xls|video)', requireAdmin, upload.single('file'), async (request, response, next) => {
  try {
    const file = request.file;
    if (!file) {
      response.status(400).json({ error: 'A file upload is required.' });
      return;
    }

    const kind = assertDocumentKind(request.params.kind);
    const record = await handleBinaryUpload(kind, file, request.header('x-user-id') ?? 'developer');
    response.status(201).json({
      message: 'File uploaded successfully',
      file: record,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/url', requireAdmin, async (request, response, next) => {
  try {
    const { url, tags, attributes } = request.body as {
      url?: string;
      tags?: string[];
      attributes?: Record<string, string>;
    };

    if (!url) {
      response.status(400).json({ error: 'A URL is required.' });
      return;
    }

    const record = await saveUpload({
      kind: 'url',
      sourceUrl: url,
      metadata: {
        sourceName: url,
        mimeType: 'text/uri-list',
        size: url.length,
        uploadedBy: request.header('x-user-id') ?? 'developer',
        storagePath: `url/${Date.now()}-${randomUUID()}.json`,
        bucket: config.uploadBucket,
        tags,
        attributes,
      },
    });

    response.status(201).json({
      message: 'URL registered successfully',
      file: record,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

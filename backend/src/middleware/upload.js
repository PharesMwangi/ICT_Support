import multer from 'multer';
import { MAX_FILES, MAX_FILE_BYTES } from '../lib/fileType.js';

// Files are kept in memory, then saved to PostgreSQL
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: MAX_FILES, fields: 10, parts: 20 },
});

export const uploadAttachments = upload.array('attachments', MAX_FILES);

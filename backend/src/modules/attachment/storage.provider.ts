import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface StorageResult {
  storagePath: string;
  storageType: 'local' | 's3';
  fileSize: number;
  mimeType: string;
}

export interface StorageProvider {
  store(file: Express.Multer.File): Promise<StorageResult>;
  retrieve(storagePath: string): Promise<Buffer>;
  delete(storagePath: string): Promise<void>;
}

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 200);
}

export class LocalStorageProvider implements StorageProvider {
  async store(file: Express.Multer.File): Promise<StorageResult> {
    const filename = `${uuidv4()}-${sanitizeFilename(file.originalname)}`;
    const relativePath = `attachments/${filename}`;
    const absolutePath = path.join(UPLOAD_DIR, relativePath);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, file.buffer);

    return {
      storagePath: relativePath,
      storageType: 'local',
      fileSize: file.size,
      mimeType: file.mimetype,
    };
  }

  async retrieve(storagePath: string): Promise<Buffer> {
    const absolutePath = path.join(UPLOAD_DIR, storagePath);
    return fs.readFile(absolutePath);
  }

  async delete(storagePath: string): Promise<void> {
    const absolutePath = path.join(UPLOAD_DIR, storagePath);
    try {
      await fs.unlink(absolutePath);
    } catch {
      // File might not exist, ignore
    }
  }
}

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/*',
  'application/pdf',
  'text/*',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.*',
  'application/zip',
];

// Disallowed extensions
const DISALLOWED_EXTENSIONS = ['.exe', '.bat', '.sh', '.dll', '.msi', '.js', '.vbs'];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  const ext = path.extname(file.originalname).toLowerCase();
  if (DISALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `File extension ${ext} is not allowed` };
  }

  return { valid: true };
}

export function getStorageProvider(): StorageProvider {
  return new LocalStorageProvider();
}

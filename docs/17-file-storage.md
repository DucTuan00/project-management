# File Storage

## Purpose
Define the file attachment system including upload flow, storage strategies (local vs S3), file validation, attachment cleanup, and download serving.

## Responsibilities

- Task and comment file attachments
- File upload with size and type validation
- Local filesystem and S3 storage backends
- Secure file serving (access control on downloads)
- Orphaned file cleanup

## Storage Backend Selection

**Decision**: Dual backend with environment-driven selection.

| Environment | Storage Backend | Config |
|-------------|----------------|--------|
| Development | Local filesystem | `uploads/` directory |
| Production | S3-compatible | AWS S3 or MinIO |

The storage backend is selected via the `STORAGE_TYPE` environment variable (`local` or `s3`). The service layer abstracts this behind a `StorageProvider` interface.

## Upload Flow

```
Client
  |
  | POST /api/v1/tasks/:taskId/attachments (multipart/form-data)
  v
Auth + RBAC Guard (attachment.create permission)
  |
  v
Validate: file size, mime type, extension
  |
  v
StorageProvider.store(file)
  |  (local: write to uploads/ dir, S3: upload to bucket)
  |
  v
Create Attachment record in database
  |
  v
Return attachment metadata (no file data in response)
```

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| POST | /api/v1/tasks/:taskId/attachments | attachment.create | Upload file(s) |
| GET | /api/v1/tasks/:taskId/attachments | attachment.read | List attachments |
| GET | /api/v1/attachments/:attachmentId/download | attachment.read | Download file |
| DELETE | /api/v1/attachments/:attachmentId | attachment.delete | Delete attachment |
| POST | /api/v1/tasks/:taskId/attachments/bulk | attachment.create | Upload multiple files |

## File Validation

| Check | Rule |
|-------|------|
| Max file size | 10MB (configurable via env) |
| Allowed MIME types | image/*, application/pdf, text/*, application/msword, application/vnd.openxmlformats-officedocument.*, application/zip |
| Disallowed extensions | .exe, .bat, .sh, .dll, .msi, .js, .vbs |
| Virus scanning | Future (ClamAV integration) |

**Multiple file uploads**: Frontend sends files individually or in batches. The bulk endpoint accepts an array of files. Each file is validated and stored independently. Partial success is supported (return IDs of successful uploads, errors for failed ones).

## StorageProvider Interface

```typescript
interface StorageProvider {
  store(file: Express.Multer.File): Promise<StorageResult>;
  retrieve(storagePath: string): Promise<ReadStream>;
  delete(storagePath: string): Promise<void>;
  getPublicUrl(storagePath: string): string;
}

interface StorageResult {
  storagePath: string;   // Relative path for DB storage
  storageType: 'local' | 's3';
  fileSize: number;
  mimeType: string;
}
```

### Local Implementation

```typescript
class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  async store(file: Express.Multer.File): Promise<StorageResult> {
    const filename = `${uuidv4()}-${sanitizeFilename(file.originalname)}`;
    const relativePath = `attachments/${filename}`;
    const absolutePath = path.join(this.uploadDir, relativePath);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, file.buffer);

    return {
      storagePath: relativePath,
      storageType: 'local',
      fileSize: file.size,
      mimeType: file.mimetype,
    };
  }

  async retrieve(storagePath: string): Promise<ReadStream> {
    return fs.createReadStream(path.join(this.uploadDir, storagePath));
  }

  async delete(storagePath: string): Promise<void> {
    await fs.unlink(path.join(this.uploadDir, storagePath));
  }
}
```

### S3 Implementation

```typescript
class S3StorageProvider implements StorageProvider {
  private s3: S3Client;
  private bucket: string;

  async store(file: Express.Multer.File): Promise<StorageResult> {
    const key = `attachments/${uuidv4()}/${sanitizeFilename(file.originalname)}`;

    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentLength: file.size,
    }));

    return {
      storagePath: key,
      storageType: 's3',
      fileSize: file.size,
      mimeType: file.mimetype,
    };
  }

  async retrieve(storagePath: string): Promise<ReadStream> {
    const response = await this.s3.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: storagePath,
    }));
    return response.Body as ReadStream;
  }

  async delete(storagePath: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: storagePath,
    }));
  }
}
```

## Download Flow

```
GET /api/v1/attachments/:attachmentId/download
  |
  v
Auth + RBAC (attachment.read permission)
  |
  v
Find attachment record
  |
  v
Verify user has access to the task (project member check)
  |
  v
Stream file from storage
  |
  v
Set headers: Content-Type, Content-Disposition, Content-Length
```

**Headers**:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="report.pdf"
Content-Length: 12345
Cache-Control: private, max-age=3600
```

Files are streamed (not buffered in memory) to handle large files efficiently. The response uses `pipe()` for local storage and `GetObjectCommand` streaming for S3.

## Attachment List Response

```json
{
  "success": true,
  "data": [
    {
      "id": "attachment-uuid",
      "fileName": "screenshot.png",
      "fileSize": 245760,
      "fileSizeFormatted": "240 KB",
      "mimeType": "image/png",
      "uploader": {
        "id": "user-uuid",
        "displayName": "Jane Doe"
      },
      "createdAt": "2025-01-15T10:30:00Z",
      "isImage": true,
      "thumbnailUrl": "/api/v1/attachments/uuid/thumbnail"
    }
  ]
}
```

## Image Thumbnails

For image attachments (mime_type starting with image/), generate a thumbnail on upload:

1. Use `sharp` library to resize to 200px width
2. Store thumbnail alongside original: `attachments/<id>/thumb_<filename>`
3. Serve via `GET /api/v1/attachments/:attachmentId/thumbnail`
4. Cache thumbnails with long max-age (30 days)

## Orphaned File Cleanup

**Orphan sources**:
- Upload started but attachment creation failed
- Attachment soft-deleted (file should be removed after grace period)
- Task hard-deleted (not applicable with soft-delete, but admin cleanup)

**Cleanup strategy**:
1. Daily BullMQ job queries for attachments with deleted_at older than 7 days
2. Deletes files from storage
3. Hard-deletes the attachment record (only after the 7-day grace period)
4. Logs cleanup actions for audit

## File Size Limits and Quotas

Per upload: 10MB. Configurable per workspace via settings.

## Best Practices

1. **Sanitize filenames** - Remove path separators, null bytes, and special characters. Use `sanitize-filename` npm package.
2. **Stream files** - Never buffer entire files in memory for download. Use streams for both local and S3.
3. **UUID in storage path** - Prevent filename collisions and make paths unpredictable (security through obscurity for direct access).
4. **Access control on every download** - The download endpoint checks task/project membership. File URLs should not be guessable but access control is the primary security layer.
5. **Content-Type validation** - Validate MIME type on both upload (file magic bytes) and download (Content-Type header) to prevent MIME-type confusion attacks.

## Design Decisions

- **Streaming downloads over direct URLs** - All file access goes through the API, which enforces RBAC. Direct S3 URLs would bypass access control and are only used for future cached/pre-signed scenarios.
- **Sharp for thumbnails** - Fast, well-maintained image processing library. Generates thumbnails synchronously on upload - acceptable latency trade-off for the user experience benefit.
- **Local storage first** - Development should not require S3. The StorageProvider abstraction makes switching backends a one-line config change.

## Future Considerations

- **Pre-signed S3 URLs** - For large files or high-traffic downloads, generate pre-signed S3 URLs with short TTL (5 minutes) to offload download traffic from the application server.
- **Direct-to-S3 uploads** - For very large files (>10MB), generate pre-signed upload URLs so the client uploads directly to S3 without proxying through the API.
- **Virus scanning** - Integrate ClamAV to scan uploads. Reject or quarantine infected files.
- **File preview** - Generate previews for PDFs, office documents, and videos using a dedicated preview service. Store preview images alongside the original.
- **CDN integration** - Serve files through a CDN (CloudFront, Cloudflare) for faster global access.

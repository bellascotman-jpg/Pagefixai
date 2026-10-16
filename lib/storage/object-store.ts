import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

let client: S3Client | null = null;

function getStorageConfig() {
  const endpoint = process.env.STORAGE_ENDPOINT;
  const accessKeyId = process.env.STORAGE_ACCESS_KEY;
  const secretAccessKey = process.env.STORAGE_SECRET_KEY;
  const bucket = process.env.STORAGE_BUCKET || 'pagefix';
  if (!endpoint || !accessKeyId || !secretAccessKey) return null;
  return { endpoint, accessKeyId, secretAccessKey, bucket, region: process.env.STORAGE_REGION || 'auto' };
}

function getClient() {
  const config = getStorageConfig();
  if (!config) return null;
  if (!client) {
    client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    });
  }
  return { client, bucket: config.bucket };
}

// Screenshots can persist in the audit's database record when private object
// storage credentials are not configured. This keeps previews and small
// deployments functional without inventing screenshot URLs or requiring a
// separate paid storage service.
export function isScreenshotStorageConfigured() {
  return true;
}

export async function storeAuditScreenshot(auditId: string, viewport: string, bytes: Buffer) {
  const storage = getClient();
  if (!storage) {
    return 'data:image/png;base64,' + bytes.toString('base64');
  }
  const key = 'audits/' + auditId + '/' + viewport + '.png';
  await storage.client.send(new PutObjectCommand({
    Bucket: storage.bucket,
    Key: key,
    Body: bytes,
    ContentType: 'image/png',
    CacheControl: 'private, no-store',
  }));
  return key;
}

export async function readAuditScreenshot(key: string) {
  if (key.startsWith('data:image/png;base64,')) {
    return Buffer.from(key.slice('data:image/png;base64,'.length), 'base64');
  }
  const storage = getClient();
  if (!storage) return null;
  const response = await storage.client.send(new GetObjectCommand({ Bucket: storage.bucket, Key: key }));
  if (!response.Body) return null;
  const bytes = await response.Body.transformToByteArray();
  return Buffer.from(bytes);
}

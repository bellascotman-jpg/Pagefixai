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

export function isScreenshotStorageConfigured() {
  return getStorageConfig() !== null;
}

export async function storeAuditScreenshot(auditId: string, viewport: string, bytes: Buffer) {
  const storage = getClient();
  if (!storage) return null;
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
  const storage = getClient();
  if (!storage) return null;
  const response = await storage.client.send(new GetObjectCommand({ Bucket: storage.bucket, Key: key }));
  if (!response.Body) return null;
  const bytes = await response.Body.transformToByteArray();
  return Buffer.from(bytes);
}

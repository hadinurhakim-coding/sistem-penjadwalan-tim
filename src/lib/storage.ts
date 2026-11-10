import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const BUCKET_NAME = process.env.NEON_STORAGE_BUCKET || 'uploads';

const s3Endpoint = process.env.AWS_ENDPOINT_URL_S3 || process.env.NEON_STORAGE_ENDPOINT;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.NEON_STORAGE_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.NEON_STORAGE_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION || process.env.NEON_STORAGE_REGION || 'us-east-2';

export const isStorageConfigured = Boolean(s3Endpoint && accessKeyId && secretAccessKey);

export const s3Client = new S3Client({
  endpoint: s3Endpoint || undefined,
  region,
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
  forcePathStyle: true,
});

/**
 * Unggah file PDF agenda ke Neon Object Storage (Bucket uploads - Private)
 */
export async function uploadAgendaPdf(params: {
  buffer: Buffer | Uint8Array;
  fileName: string;
  contentType?: string;
}): Promise<{ key: string; fileName: string; size: number }> {
  if (!isStorageConfigured) {
    throw new Error('Kredensial Neon Object Storage belum diatur di variabel lingkungan.');
  }

  // Sanitasi nama file dan tambahkan timestamp acak agar unik
  const cleanName = params.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `agenda-reports/${Date.now()}_${cleanName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: params.buffer,
    ContentType: params.contentType || 'application/pdf',
  });

  await s3Client.send(command);

  return {
    key,
    fileName: params.fileName,
    size: params.buffer.byteLength,
  };
}

/**
 * Buat Pre-Signed URL sementara (valid 1 jam) untuk mengunduh/melihat PDF secara aman dari bucket Private
 */
export async function getPresignedPdfUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
  if (!isStorageConfigured) {
    throw new Error('Kredensial Neon Object Storage belum diatur.');
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

/**
 * Hapus berkas PDF dari bucket uploads
 */
export async function deleteAgendaPdf(key: string): Promise<void> {
  if (!isStorageConfigured) return;

  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
  } catch (err) {
    console.warn(`Gagal menghapus file ${key} dari bucket:`, err);
  }
}

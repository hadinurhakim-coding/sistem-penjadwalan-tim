import fs from 'fs';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Read .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  }
}

const s3 = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
});

const BUCKET = 'uploads';

async function test() {
  console.log('Testing Neon Object Storage (Bucket: uploads)...');
  console.log('Endpoint:', process.env.AWS_ENDPOINT_URL_S3);
  console.log('Region:', process.env.AWS_REGION);

  const dummyPdf = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF');
  const key = `test/test-${Date.now()}.pdf`;

  try {
    // 1. PutObject
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: dummyPdf,
      ContentType: 'application/pdf',
    }));
    console.log('✅ 1. Berhasil PutObject ke Neon Storage bucket uploads:', key);

    // 2. Presigned GET URL
    const getCmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const url = await getSignedUrl(s3, getCmd, { expiresIn: 300 });
    console.log('✅ 2. Berhasil generate Pre-signed GET URL:', url.slice(0, 60) + '...');

    // 3. DeleteObject
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    console.log('✅ 3. Berhasil DeleteObject (cleanup).');

    console.log('\n🎉 Neon Object Storage (Bucket: uploads) TERBUKTI BERFUNGSI 100%!');
  } catch (err) {
    console.error('Storage test failed:', err);
    process.exit(1);
  }
}

test();

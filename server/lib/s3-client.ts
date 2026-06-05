import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
export const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
  console.warn("⚠️ Missing Cloudflare R2 environment variables. Uploads to R2 will fail.");
}

export const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || "",
    secretAccessKey: secretAccessKey || "",
  },
});

/**
 * Generate a pre-signed URL for direct browser-to-R2 uploads.
 * @param folder The folder path (e.g. 'albums', 'eventfold_brand')
 * @param contentType The MIME type of the file (e.g. 'image/jpeg')
 * @returns The presigned URL and the final public URL of the object
 */
export async function generatePresignedUrl(folder: string, contentType: string) {
  const fileExtension = contentType.split("/")[1] || "bin";
  // Generate a random string instead of UUID to keep URLs short like Cloudinary
  const randomId = crypto.randomBytes(8).toString("hex");
  const key = `${folder}/${randomId}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  const finalUrl = `${publicUrl}/${key}`;

  return { uploadUrl, finalUrl, key };
}

/**
 * Upload a buffer directly to R2 from the server.
 */
export async function uploadBufferToR2(buffer: Buffer, folder: string, contentType: string) {
  const fileExtension = contentType.split("/")[1] || "bin";
  const randomId = crypto.randomBytes(8).toString("hex");
  const key = `${folder}/${randomId}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return `${publicUrl}/${key}`;
}

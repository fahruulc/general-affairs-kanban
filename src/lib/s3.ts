import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { APP_CONFIG } from "./constants";

const endpoint = process.env.S3_ENDPOINT || "http://127.0.0.1:9000";
const region = process.env.S3_REGION || "us-east-1";
const bucket = process.env.S3_BUCKET || "lapor-ga";
const accessKeyId = process.env.S3_ACCESS_KEY_ID || "localaccess";
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || "localsecret123";
const forcePathStyle = process.env.S3_FORCE_PATH_STYLE !== "false";

export const s3Client = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle,
  // Required for Backblaze B2 S3-compatibility
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
} as any);

export function getBucketName(): string {
  return bucket;
}

/**
 * Generate a secure, user-isolated object key for uploading
 * Format: uploads/{userId}/{yyyy}/{mm}/{uuid}.{ext}
 */
export function generateObjectKey(userId: string, originalFileName: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const ext = originalFileName.split(".").pop()?.toLowerCase() || "jpg";
  const uuid = randomUUID();

  return `uploads/${userId}/${year}/${month}/${uuid}.${ext}`;
}

/**
 * Validate that an object key belongs to the given user and follows the required prefix
 */
export function isObjectKeyOwnedByUser(objectKey: string, userId: string): boolean {
  return objectKey.startsWith(`uploads/${userId}/`);
}

/**
 * Generate presigned URL for PUT upload (TTL 5 minutes by default)
 */
export async function createPresignedUploadUrl(
  objectKey: string,
  contentType: string,
  expiresInSeconds: number = APP_CONFIG.uploadUrlTtlSeconds
): Promise<{ uploadUrl: string; objectKey: string }> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: expiresInSeconds,
  });

  return { uploadUrl, objectKey };
}

/**
 * Generate presigned URL for GET download/view (TTL 10 minutes by default)
 */
export async function createPresignedDownloadUrl(
  objectKey: string,
  expiresInSeconds: number = APP_CONFIG.downloadUrlTtlSeconds
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: objectKey,
  });

  return await getSignedUrl(s3Client, command, {
    expiresIn: expiresInSeconds,
  });
}

/**
 * Verify if object exists in S3 and return its metadata
 */
export async function verifyObjectExists(
  objectKey: string
): Promise<{ sizeBytes: number; contentType?: string } | null> {
  try {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    });
    const result = await s3Client.send(command);
    return {
      sizeBytes: result.ContentLength ?? 0,
      contentType: result.ContentType,
    };
  } catch (error: any) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw error;
  }
}

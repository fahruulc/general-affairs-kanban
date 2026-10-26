import { S3Client, HeadBucketCommand, CreateBucketCommand } from "@aws-sdk/client-s3";

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch {
    // Ignore if .env doesn't exist
  }
}

async function initStorage() {
  const endpoint = process.env.S3_ENDPOINT || "http://127.0.0.1:9000";
  const region = process.env.S3_REGION || "us-east-1";
  const bucket = process.env.S3_BUCKET || "lapor-ga";
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || "localaccess";
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || "localsecret123";
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE !== "false";

  console.log(`Connecting to S3 at ${endpoint}, region: ${region}, bucket: ${bucket}...`);

  const client = new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle,
  });

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log(`Bucket "${bucket}" already exists.`);
  } catch (error: any) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      console.log(`Bucket "${bucket}" does not exist. Creating...`);
      await client.send(new CreateBucketCommand({ Bucket: bucket }));
      console.log(`Bucket "${bucket}" created successfully.`);
    } else {
      console.error(`Error checking/creating bucket:`, error);
      process.exit(1);
    }
  }
}

initStorage().catch((err) => {
  console.error("Storage init failed:", err);
  process.exit(1);
});

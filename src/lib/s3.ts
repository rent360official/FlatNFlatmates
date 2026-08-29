import { S3Client } from "@aws-sdk/client-s3";

export function getS3Config() {
  return {
    region: process.env.AWS_REGION || "ap-south-1",
    bucketName: process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

let s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
  // If already initialized and keys are present, return it
  if (s3Client) return s3Client;

  const config = getS3Config();

  if (!config.accessKeyId || !config.secretAccessKey) {
    throw new Error(
      "AWS credentials (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY) are missing in environment configuration."
    );
  }

  s3Client = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return s3Client;
}

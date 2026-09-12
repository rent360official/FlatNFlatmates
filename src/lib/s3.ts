import { S3Client, DeleteObjectCommand, DeleteObjectsCommand, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

export function getS3Config() {
  return {
    region: process.env.AWS_REGION || "ap-south-1",
    bucketName: process.env.AWS_S3_BUCKET_NAME,
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

export async function deleteS3Object(key: string): Promise<void> {
  if (!key) return;
  const config = getS3Config();
  if (!config.bucketName) return;

  try {
    const client = getS3Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      })
    );
  } catch (error) {
    console.error(`Failed to delete S3 object: ${key}`, error);
  }
}

export async function deleteS3Objects(keys: string[]): Promise<void> {
  const validKeys = keys.filter(Boolean);
  if (validKeys.length === 0) return;
  const config = getS3Config();
  if (!config.bucketName) return;

  try {
    const client = getS3Client();
    await client.send(
      new DeleteObjectsCommand({
        Bucket: config.bucketName,
        Delete: {
          Objects: validKeys.map((Key) => ({ Key })),
          Quiet: true,
        },
      })
    );
  } catch (error) {
    console.error("Failed to delete S3 objects:", error);
  }
}

export async function uploadBufferToS3(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const config = getS3Config();
  if (!config.bucketName) throw new Error("S3 Bucket Name not configured");

  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${key}`;
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  const config = getS3Config();
  if (!config.bucketName) throw new Error("S3 Bucket Name not configured");

  const client = getS3Client();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    })
  );

  const streamToBuffer = async (stream: any): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
      const chunks: any[] = [];
      stream.on("data", (chunk: any) => chunks.push(chunk));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  };

  return streamToBuffer(response.Body);
}


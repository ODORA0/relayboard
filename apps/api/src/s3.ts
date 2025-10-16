import { Client } from "minio";
import { env } from "./env.js";

export const minio = new Client({
  endPoint: new URL(env.s3.endpoint).hostname,
  port: parseInt(new URL(env.s3.endpoint).port || "80", 10),
  useSSL: env.s3.endpoint.startsWith("https"),
  accessKey: env.s3.accessKey,
  secretKey: env.s3.secretKey,
});

export const ensureBucket = async (bucket: string) => {
  const exists = await minio.bucketExists(bucket).catch(() => false);
  if (!exists) await minio.makeBucket(bucket, env.s3.region);
};

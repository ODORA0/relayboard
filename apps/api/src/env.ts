import "dotenv/config";

export const env = {
  port: parseInt(process.env.API_PORT || "4000", 10),
  pg: {
    host: process.env.PG_HOST || "127.0.0.1",
    port: parseInt(process.env.PG_PORT || "5433", 10),
    user: process.env.PG_USER || "relayboard",
    password: process.env.PG_PASSWORD || "relayboard",
    database: process.env.PG_DATABASE || "relayboard",
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT || "http://127.0.0.1:9000",
    region: process.env.S3_REGION || "us-east-1",
    accessKey: process.env.S3_ACCESS_KEY || "relayboard",
    secretKey: process.env.S3_SECRET_KEY || "relayboard123",
    bucket: process.env.S3_BUCKET || "relayboard",
  },
  workerBase: process.env.WORKER_BASE_URL || "http://127.0.0.1:5055",
  slackWebhook: process.env.SLACK_WEBHOOK || "",
};

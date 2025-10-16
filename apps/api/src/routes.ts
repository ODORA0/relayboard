import { Controller, Get, Post, Body } from "@nestjs/common";
import { pool } from "./db.js";
import { env } from "./env.js";
import { ensureBucket, minio } from "./s3.js";
import * as crypto from "crypto";

type CsvRegisterDto = {
  name: string;
  csvUrl: string;
};

type SlackDto = { webhookUrl: string };

type RunDto = { datasetName: string };

@Controller()
export class AppController {
  @Get("/health")
  health() {
    return { ok: true, service: "api", ts: new Date().toISOString() };
  }

  @Post("/v1/destinations/slack")
  async setSlack(@Body() body: SlackDto) {
    const url = body.webhookUrl || env.slackWebhook;
    if (!url) return { ok: false, error: "No Slack webhook provided" };
    await pool.query(
      `insert into destination(kind, config_json) values($1, $2)
       on conflict do nothing`,
      ["slack", { webhookUrl: url } as any]
    );
    return { ok: true };
  }

  @Post("/v1/datasets/csv")
  async registerCsv(@Body() body: CsvRegisterDto) {
    const { name, csvUrl } = body;
    if (!name || !csvUrl)
      return { ok: false, error: "name and csvUrl required" };

    await ensureBucket(env.s3.bucket);

    // Download and stream upload to MinIO
    const res = await fetch(csvUrl);
    if (!res.ok) return { ok: false, error: "Failed to fetch CSV URL" };
    const buf = Buffer.from(await res.arrayBuffer());
    const key = `uploads/${Date.now()}-${crypto
      .randomBytes(6)
      .toString("hex")}.csv`;
    await minio.putObject(env.s3.bucket, key, buf, buf.length, {
      "Content-Type": "text/csv",
    });

    await pool.query(
      "insert into dataset(name, source_kind, s3_key) values($1,$2,$3) on conflict(name) do update set s3_key=$3",
      [name, "csv", key]
    );

    return { ok: true, s3Key: key };
  }

  @Post("/v1/pipelines/run")
  async runPipeline(@Body() body: RunDto) {
    const { datasetName } = body;
    const { rows } = await pool.query(
      "select id, name, s3_key from dataset where name=$1",
      [datasetName]
    );
    if (rows.length === 0) return { ok: false, error: "dataset not found" };
    const ds = rows[0];
    const { rows: dests } = await pool.query(
      "select config_json from destination where kind='slack' order by id desc limit 1"
    );
    if (dests.length === 0)
      return { ok: false, error: "slack destination not configured" };
    const slack = dests[0].config_json;

    // Create run row
    const { rows: runRows } = await pool.query(
      "insert into run(dataset_id, status) values($1,$2) returning id",
      [ds.id, "queued"]
    );
    const runId = runRows[0].id;

    // Call worker to load CSV -> staging, run dbt, then dispatch to Slack
    const payload = {
      runId,
      datasetName: ds.name,
      s3: {
        endpoint: env.s3.endpoint,
        bucket: env.s3.bucket,
        key: ds.s3_key,
        accessKey: env.s3.accessKey,
        secretKey: env.s3.secretKey,
      },
      pg: env.pg,
      slack,
    };

    const r = await fetch(`${env.workerBase}/run_full`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const jr = await r.json();
    return { ok: true, runId, worker: jr };
  }
}

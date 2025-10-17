#!/usr/bin/env node

/**
 * RelayBoard Diagnostic Script
 * Helps identify issues with the pipeline
 */

import { pool } from "./dist/db.js";
import { env } from "./dist/env.js";

async function runDiagnostics() {
  console.log("🔍 RelayBoard Pipeline Diagnostics");
  console.log("===================================");

  try {
    // 1. Check database connection
    console.log("\n1. Testing database connection...");
    const dbTest = await pool.query("SELECT NOW() as current_time");
    console.log("✅ Database connected:", dbTest.rows[0].current_time);

    // 2. Check datasets
    console.log("\n2. Checking registered datasets...");
    const datasets = await pool.query(
      "SELECT id, name, s3_key, created_at FROM dataset ORDER BY created_at DESC"
    );
    if (datasets.rows.length === 0) {
      console.log("❌ No datasets found in database");
    } else {
      console.log(`✅ Found ${datasets.rows.length} dataset(s):`);
      datasets.rows.forEach((ds) => {
        console.log(`   - ${ds.name} (ID: ${ds.id}, S3 Key: ${ds.s3_key})`);
      });
    }

    // 3. Check Slack destinations
    console.log("\n3. Checking Slack destinations...");
    const slackDests = await pool.query(
      "SELECT id, config_json, created_at FROM destination WHERE kind='slack' ORDER BY created_at DESC"
    );
    if (slackDests.rows.length === 0) {
      console.log("❌ No Slack destinations configured");
    } else {
      console.log(`✅ Found ${slackDests.rows.length} Slack destination(s):`);
      slackDests.rows.forEach((dest) => {
        const config = dest.config_json;
        console.log(
          `   - ID: ${dest.id}, Webhook: ${
            config.webhookUrl ? "configured" : "missing"
          }`
        );
      });
    }

    // 4. Check worker connectivity
    console.log("\n4. Testing worker connectivity...");
    try {
      const workerResponse = await fetch(`${env.workerBase}/health`);
      if (workerResponse.ok) {
        const workerHealth = await workerResponse.json();
        console.log("✅ Worker is accessible:", workerHealth);
      } else {
        console.log("❌ Worker health check failed:", workerResponse.status);
      }
    } catch (error) {
      console.log("❌ Cannot connect to worker:", error.message);
      console.log(`   Worker URL: ${env.workerBase}`);
    }

    // 5. Check S3/MinIO connectivity
    console.log("\n5. Testing S3/MinIO connectivity...");
    console.log(`   Endpoint: ${env.s3.endpoint}`);
    console.log(`   Bucket: ${env.s3.bucket}`);
    console.log(`   Region: ${env.s3.region}`);

    // 6. Check recent runs
    console.log("\n6. Checking recent pipeline runs...");
    const runs = await pool.query(`
      SELECT r.id, r.status, r.started_at, r.finished_at, r.error, d.name as dataset_name
      FROM run r 
      JOIN dataset d ON r.dataset_id = d.id 
      ORDER BY r.started_at DESC 
      LIMIT 5
    `);

    if (runs.rows.length === 0) {
      console.log("ℹ️  No pipeline runs found");
    } else {
      console.log(`✅ Found ${runs.rows.length} recent run(s):`);
      runs.rows.forEach((run) => {
        const status =
          run.status === "completed"
            ? "✅"
            : run.status === "failed"
            ? "❌"
            : run.status === "queued"
            ? "⏳"
            : "🔄";
        console.log(
          `   ${status} Run ${run.id}: ${run.dataset_name} (${run.status})`
        );
        if (run.error) {
          console.log(`      Error: ${run.error}`);
        }
      });
    }

    // 7. Environment summary
    console.log("\n7. Environment Configuration:");
    console.log(`   API Port: ${env.port}`);
    console.log(
      `   Database: ${env.pg.host}:${env.pg.port}/${env.pg.database}`
    );
    console.log(`   Worker URL: ${env.workerBase}`);
    console.log(`   S3 Endpoint: ${env.s3.endpoint}`);
  } catch (error) {
    console.error("❌ Diagnostic failed:", error);
  } finally {
    await pool.end();
  }
}

runDiagnostics().catch(console.error);

/**
 * Relayboard API Server
 *
 * @author AJAL ODORA JONATHAN
 * @github https://github.com/ODORA0
 * @description NestJS API server for Relayboard data pipeline platform
 */

import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./module.js";
import { pino } from "pino";
import { ensureSchema } from "./sql_init.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const logger = pino({ level: process.env.LOG_LEVEL || "info" });
  const port = process.env.API_PORT || process.env.PORT || 4000;
  app.enableCors();
  await ensureSchema();
  await app.listen(port as number);
  logger.info(`API listening on http://localhost:${port}`);
}
bootstrap();

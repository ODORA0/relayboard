import { pool } from "./db.js";

export async function ensureSchema() {
  await pool.query(`
    create schema if not exists staging;
    create schema if not exists warehouse;

    create table if not exists destination (
      id serial primary key,
      kind text not null, -- 'slack'
      config_json jsonb not null,
      created_at timestamptz default now()
    );

    create table if not exists dataset (
      id serial primary key,
      name text not null unique,
      source_kind text not null, -- 'csv'
      s3_key text not null,
      created_at timestamptz default now()
    );

    create table if not exists run (
      id serial primary key,
      dataset_id int not null references dataset(id),
      status text not null,
      started_at timestamptz default now(),
      finished_at timestamptz,
      error text
    );
  `);
}

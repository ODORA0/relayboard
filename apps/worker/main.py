"""
Relayboard Data Worker

@author AJAL ODORA JONATHAN
@github https://github.com/ODORA0
@description Python/FastAPI worker for Relayboard data pipeline platform
"""

from fastapi import FastAPI
from pydantic import BaseModel
from typing import Any, Dict
import duckdb, io, os, csv, json, subprocess, tempfile, requests
import boto3
import psycopg
import pandas as pd
from rich.console import Console
from datetime import datetime

app = FastAPI()
console = Console()

class S3Info(BaseModel):
    endpoint: str
    bucket: str
    key: str
    accessKey: str
    secretKey: str

class PGInfo(BaseModel):
    host: str
    port: int
    user: str
    password: str
    database: str

class SlackInfo(BaseModel):
    webhookUrl: str

class RunFullPayload(BaseModel):
    runId: int
    datasetName: str
    s3: S3Info
    pg: PGInfo
    slack: SlackInfo

def download_from_minio_to_bytes(s3: S3Info) -> bytes:
    session = boto3.session.Session()
    client = session.client('s3',
        endpoint_url=s3.endpoint,
        aws_access_key_id=s3.accessKey,
        aws_secret_access_key=s3.secretKey,
        region_name='us-east-1',
    )
    obj = client.get_object(Bucket=s3.bucket, Key=s3.key)
    return obj['Body'].read()

@app.post('/preview')
def preview(payload: Dict[str, Any]):
    # placeholder
    return {"ok": True, "msg": "implement preview with DuckDB on bytes"}

def load_csv_to_postgres(csv_bytes: bytes, pg: PGInfo, staging_table: str):
    conn_str = f"host={pg.host} port={pg.port} user={pg.user} password={pg.password} dbname={pg.database}"
    with psycopg.connect(conn_str) as conn:
        with conn.cursor() as cur:
            cur.execute("create schema if not exists staging;")
            cur.execute(f'drop table if exists staging."{staging_table}";')
            # Use pandas to infer & create
            df = pd.read_csv(io.BytesIO(csv_bytes))
            # Clean column names to be valid PostgreSQL identifiers
            def clean_column_name(name):
                # Remove quotes and clean the name
                cleaned = str(name).strip().replace('"', '').replace("'", "").replace(" ", "_")
                # If it's numeric or starts with a number, prefix with 'col_'
                if cleaned.isdigit() or (cleaned and cleaned[0].isdigit()):
                    cleaned = f"col_{cleaned}"
                # If empty after cleaning, use a default
                if not cleaned:
                    cleaned = "unnamed_column"
                return cleaned.lower()
            
            df.columns = [clean_column_name(c) for c in df.columns]
            # Define table structure (all text for simplicity)
            col_defs = ", ".join([f'"{c}" text' for c in df.columns])
            cur.execute(f'create table staging."{staging_table}" ({col_defs});')
            # Write temp CSV to disk and use psycopg copy
            tmp_path = tempfile.mktemp(suffix=".csv")
            df.to_csv(tmp_path, index=False)
            with open(tmp_path, "r", encoding="utf-8") as f:
                cur.copy(f'COPY staging."{staging_table}" FROM STDIN WITH (FORMAT CSV, HEADER TRUE)', f)
            os.remove(tmp_path)
        conn.commit()

def ensure_dbt_model(dataset: str, df_sample_cols):
    models_dir = os.path.join(os.getcwd(), '..', '..', 'dbt', 'relayboard', 'models', 'generated')
    os.makedirs(models_dir, exist_ok=True)
    model_path = os.path.join(models_dir, f"{dataset}_clean.sql")
    
    # Clean column names the same way as in load_csv_to_postgres
    def clean_column_name(name):
        cleaned = str(name).strip().replace('"', '').replace("'", "").replace(" ", "_")
        if cleaned.isdigit() or (cleaned and cleaned[0].isdigit()):
            cleaned = f"col_{cleaned}"
        if not cleaned:
            cleaned = "unnamed_column"
        return cleaned.lower()
    
    cleaned_cols = [clean_column_name(c) for c in df_sample_cols]
    select_cols = ', '.join([f'"{c}"' for c in cleaned_cols])
    sql = f"-- auto-generated model for {dataset}\nselect {select_cols} from staging.\"{dataset}\""
    
    with open(model_path, 'w') as f:
        f.write(sql)
    return model_path

def run_dbt(pg: PGInfo):
    # profiles.yml already points to localhost; env vars optional
    dbt_dir = os.path.join(os.getcwd(), '..', '..', 'dbt', 'relayboard')
    return subprocess.run(["dbt", "run"], cwd=dbt_dir, capture_output=True, text=True)

def dispatch_to_slack(slack: SlackInfo, pg: PGInfo, dataset: str, limit:int=5):
    conn_str = f"host={pg.host} port={pg.port} user={pg.user} password={pg.password} dbname={pg.database}"
    with psycopg.connect(conn_str) as conn:
        with conn.cursor() as cur:
            # simple: read from warehouse.<dataset>_clean if exists, else from staging
            table = f'warehouse."{dataset}_clean"'
            try:
                cur.execute(f"select * from {table} limit {limit}")
            except Exception:
                table = f'staging."{dataset}"'
                cur.execute(f"select * from {table} limit {limit}")
            rows = cur.fetchall()
            cols = [d[0] for d in cur.description]
    text_lines = ["*Relayboard Dispatch*",
                  f"Table: `{table}`",
                  f"Rows: {len(rows)}",
                  "```"]
    for r in rows:
        line = ', '.join([f"{c}={str(v)[:32]}" for c,v in zip(cols, r)])
        text_lines.append(line)
    text_lines.append("```")
    payload = {"text": "\n".join(text_lines)}
    requests.post(slack.webhookUrl, json=payload)

@app.post('/run_full')
def run_full(payload: RunFullPayload):
    try:
        console.rule(f"[bold cyan]Run {payload.runId} :: {payload.datasetName}")
        # 1) fetch CSV
        console.print("[yellow]Step 1: Fetching CSV from MinIO...")
        csv_bytes = download_from_minio_to_bytes(payload.s3)
        console.print(f"[green]✓ CSV downloaded, size: {len(csv_bytes)} bytes")
        
        # 2) load to Postgres staging
        console.print("[yellow]Step 2: Loading CSV to PostgreSQL staging...")
        staging_table = payload.datasetName
        load_csv_to_postgres(csv_bytes, payload.pg, staging_table)
        console.print(f"[green]✓ CSV loaded to staging.{staging_table}")
        
        # 3) generate dbt model and run dbt
        console.print("[yellow]Step 3: Generating dbt model...")
        df = pd.read_csv(io.BytesIO(csv_bytes), nrows=1)
        ensure_dbt_model(payload.datasetName, df.columns.tolist())
        console.print("[green]✓ dbt model generated")
        
        console.print("[yellow]Step 4: Running dbt...")
        r = run_dbt(payload.pg)
        console.print(f"[green]✓ dbt completed, stdout: {r.stdout[-200:]}")
        
        # 4) dispatch to Slack
        if payload.slack and payload.slack.webhookUrl:
            console.print("[yellow]Step 5: Dispatching to Slack...")
            dispatch_to_slack(payload.slack, payload.pg, payload.datasetName, limit=5)
            console.print("[green]✓ Slack dispatch completed")
        
        return {"ok": True, "dbt_stdout": r.stdout[-500:], "dbt_stderr": r.stderr[-500:]}
    except Exception as e:
        console.print(f"[red]Error in run_full: {str(e)}")
        import traceback
        console.print(f"[red]Traceback: {traceback.format_exc()}")
        return {"ok": False, "error": str(e), "traceback": traceback.format_exc()}

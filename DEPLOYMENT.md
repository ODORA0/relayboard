# RelayBoard Free Hosting Deployment Guide

This guide will help you deploy RelayBoard to free hosting services with a $0/month cost.

## Architecture Overview

- **Frontend (Next.js)**: Vercel Hobby (Free)
- **API (NestJS)**: Fly.io (Free shared VM)
- **Worker (FastAPI)**: Fly.io (Free shared VM)
- **Database**: Neon (Free PostgreSQL)
- **Storage**: Supabase Storage (Free) or Backblaze B2 (Free 10GB)

## Prerequisites

1. GitHub repository pushed (✅ Done)
2. Node.js 20+ and pnpm installed locally
3. Python 3.11+ installed locally
4. Docker installed (for local testing)

## Step 1: Set Up Free Services

### A) Neon Database (PostgreSQL)

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string (format: `postgresql://user:password@host:5432/database`)
4. Note down these values:
   - `PG_HOST`: host from connection string
   - `PG_PORT`: 5432
   - `PG_USER`: username
   - `PG_PASSWORD`: password
   - `PG_DATABASE`: database name

### B) Object Storage (Choose one)

#### Option 1: Supabase Storage (Recommended)

1. Go to [Supabase](https://supabase.com/)
2. Create a new project
3. Go to Storage → Create bucket named `relayboard`
4. Go to Settings → API → Create service role key
5. Note down:
   - `S3_ENDPOINT`: `https://your-project.supabase.co/storage/v1/s3`
   - `S3_REGION`: `us-east-1`
   - `S3_ACCESS_KEY`: service role key
   - `S3_SECRET_KEY`: service role secret
   - `S3_BUCKET`: `relayboard`

#### Option 2: Backblaze B2

1. Go to [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html)
2. Create account and bucket named `relayboard`
3. Create application key
4. Note down:
   - `S3_ENDPOINT`: `https://s3.us-west-000.backblazeb2.com`
   - `S3_REGION`: `us-west-000`
   - `S3_ACCESS_KEY`: application key ID
   - `S3_SECRET_KEY`: application key
   - `S3_BUCKET`: `relayboard`

## Step 2: Deploy API to Fly.io

### Install Fly CLI

```bash
# macOS
brew install flyctl

# Linux/Windows
curl -L https://fly.io/install.sh | sh
```

### Authenticate

```bash
fly auth signup
# or if you have an account
fly auth login
```

### Deploy API

```bash
cd apps/api

# Launch the app (creates fly.toml if needed)
fly launch --no-deploy --copy-config --name relayboard-api-yourname

# Set environment variables
fly secrets set \
  API_PORT=4000 \
  PG_HOST=your-neon-host \
  PG_PORT=5432 \
  PG_USER=your-neon-user \
  PG_PASSWORD=your-neon-password \
  PG_DATABASE=your-neon-database \
  S3_ENDPOINT=your-s3-endpoint \
  S3_REGION=your-s3-region \
  S3_ACCESS_KEY=your-s3-access-key \
  S3_SECRET_KEY=your-s3-secret-key \
  S3_BUCKET=relayboard \
  WORKER_BASE_URL=https://relayboard-worker-yourname.fly.dev

# Deploy
fly deploy

# Note your API URL
echo "API URL: https://relayboard-api-yourname.fly.dev"
```

## Step 3: Deploy Worker to Fly.io

```bash
cd ../worker

# Launch the worker app
fly launch --no-deploy --copy-config --name relayboard-worker-yourname

# Set environment variables
fly secrets set \
  PG_HOST=your-neon-host \
  PG_PORT=5432 \
  PG_USER=your-neon-user \
  PG_PASSWORD=your-neon-password \
  PG_DATABASE=your-neon-database \
  S3_ENDPOINT=your-s3-endpoint \
  S3_REGION=your-s3-region \
  S3_ACCESS_KEY=your-s3-access-key \
  S3_SECRET_KEY=your-s3-secret-key \
  S3_BUCKET=relayboard

# Deploy
fly deploy

# Test health endpoint
curl https://relayboard-worker-yourname.fly.dev/health
```

## Step 4: Deploy Frontend to Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from web directory
cd apps/web
vercel

# Set environment variable
vercel env add NEXT_PUBLIC_API_BASE
# Enter: https://relayboard-api-yourname.fly.dev
```

### Option 2: Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Import Project"
3. Connect your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `.next`
5. Add Environment Variable:
   - **Name**: `NEXT_PUBLIC_API_BASE`
   - **Value**: `https://relayboard-api-yourname.fly.dev`
6. Deploy

## Step 5: Update API Worker URL

After deploying the worker, update the API with the correct worker URL:

```bash
cd apps/api
fly secrets set WORKER_BASE_URL=https://relayboard-worker-yourname.fly.dev
```

## Step 6: Test Your Deployment

1. **Frontend**: Visit your Vercel URL
2. **API Health**: `curl https://relayboard-api-yourname.fly.dev/health`
3. **Worker Health**: `curl https://relayboard-worker-yourname.fly.dev/health`
4. **Full Flow Test**:
   - Open your Vercel app
   - Configure Slack webhook
   - Upload a CSV file
   - Run the pipeline
   - Check Slack for results

## Troubleshooting

### Common Issues

1. **CORS Errors**: The API has CORS enabled, but if you get errors, check that your Vercel domain is allowed.

2. **Database Connection**: Ensure Neon database is not sleeping. First request might be slow.

3. **S3 Access**: Verify your S3 credentials and bucket permissions.

4. **Worker Timeout**: Fly.io free tier has resource limits. Large CSV files might timeout.

### Monitoring

- **Fly.io**: Check logs with `fly logs -a relayboard-api` or `fly logs -a relayboard-worker`
- **Vercel**: Check deployment logs in Vercel dashboard
- **Neon**: Monitor database usage in Neon console

## Cost Breakdown

- **Vercel Hobby**: Free (with limits)
- **Fly.io**: Free (2 shared VMs)
- **Neon**: Free (with usage limits)
- **Supabase/Backblaze**: Free (with storage limits)

**Total Monthly Cost: $0**

## Scaling Considerations

When you're ready to scale:

1. **Fly.io**: Upgrade to paid plans for dedicated resources
2. **Database**: Neon Pro for higher limits
3. **Storage**: Upgrade storage plans as needed
4. **CDN**: Add Cloudflare for better performance

## Security Notes

- All secrets are stored in Fly.io secrets (not in git)
- HTTPS is enforced on all services
- Database connections use SSL
- S3 access uses proper authentication

## Support

If you encounter issues:

1. Check the logs for each service
2. Verify all environment variables are set correctly
3. Test each service individually
4. Check service status pages for outages

---

**Your RelayBoard application is now live at $0/month!** 🎉

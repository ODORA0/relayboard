#!/bin/bash

# RelayBoard Deployment Script
# This script helps deploy RelayBoard to free hosting services

set -e

echo "🚀 RelayBoard Free Deployment Script"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v flyctl &> /dev/null; then
        print_error "flyctl is not installed. Please install it first:"
        echo "  macOS: brew install flyctl"
        echo "  Linux/Windows: curl -L https://fly.io/install.sh | sh"
        exit 1
    fi
    
    if ! command -v vercel &> /dev/null; then
        print_warning "vercel CLI is not installed. You can install it with: npm i -g vercel"
        print_warning "Or deploy manually through the Vercel dashboard"
    fi
    
    print_success "Dependencies check complete"
}

# Deploy API to Fly.io
deploy_api() {
    print_status "Deploying API to Fly.io..."
    
    cd apps/api
    
    # Check if fly.toml exists, if not create it
    if [ ! -f "fly.toml" ]; then
        print_status "Creating fly.toml for API..."
        fly launch --no-deploy --copy-config --name relayboard-api-$(whoami)
    fi
    
    print_status "Setting up environment variables..."
    echo "Please provide the following information:"
    
    read -p "Neon Database Host: " PG_HOST
    read -p "Neon Database Port (default 5432): " PG_PORT
    PG_PORT=${PG_PORT:-5432}
    read -p "Neon Database User: " PG_USER
    read -s -p "Neon Database Password: " PG_PASSWORD
    echo
    read -p "Neon Database Name: " PG_DATABASE
    
    read -p "S3 Endpoint URL: " S3_ENDPOINT
    read -p "S3 Region: " S3_REGION
    read -p "S3 Access Key: " S3_ACCESS_KEY
    read -s -p "S3 Secret Key: " S3_SECRET_KEY
    echo
    read -p "S3 Bucket Name: " S3_BUCKET
    
    read -p "Worker Base URL (will be updated after worker deployment): " WORKER_BASE_URL
    
    # Set secrets
    fly secrets set \
        API_PORT=4000 \
        PG_HOST="$PG_HOST" \
        PG_PORT="$PG_PORT" \
        PG_USER="$PG_USER" \
        PG_PASSWORD="$PG_PASSWORD" \
        PG_DATABASE="$PG_DATABASE" \
        S3_ENDPOINT="$S3_ENDPOINT" \
        S3_REGION="$S3_REGION" \
        S3_ACCESS_KEY="$S3_ACCESS_KEY" \
        S3_SECRET_KEY="$S3_SECRET_KEY" \
        S3_BUCKET="$S3_BUCKET" \
        WORKER_BASE_URL="$WORKER_BASE_URL"
    
    print_status "Deploying API..."
    fly deploy
    
    API_URL=$(fly info --json | jq -r '.Hostname')
    print_success "API deployed successfully!"
    print_success "API URL: https://$API_URL"
    
    cd ../..
    echo "$API_URL" > .api_url
}

# Deploy Worker to Fly.io
deploy_worker() {
    print_status "Deploying Worker to Fly.io..."
    
    cd apps/worker
    
    # Check if fly.toml exists, if not create it
    if [ ! -f "fly.toml" ]; then
        print_status "Creating fly.toml for Worker..."
        fly launch --no-deploy --copy-config --name relayboard-worker-$(whoami)
    fi
    
    print_status "Setting up environment variables..."
    echo "Please provide the following information:"
    
    read -p "Neon Database Host: " PG_HOST
    read -p "Neon Database Port (default 5432): " PG_PORT
    PG_PORT=${PG_PORT:-5432}
    read -p "Neon Database User: " PG_USER
    read -s -p "Neon Database Password: " PG_PASSWORD
    echo
    read -p "Neon Database Name: " PG_DATABASE
    
    read -p "S3 Endpoint URL: " S3_ENDPOINT
    read -p "S3 Region: " S3_REGION
    read -p "S3 Access Key: " S3_ACCESS_KEY
    read -s -p "S3 Secret Key: " S3_SECRET_KEY
    echo
    read -p "S3 Bucket Name: " S3_BUCKET
    
    # Set secrets
    fly secrets set \
        PG_HOST="$PG_HOST" \
        PG_PORT="$PG_PORT" \
        PG_USER="$PG_USER" \
        PG_PASSWORD="$PG_PASSWORD" \
        PG_DATABASE="$PG_DATABASE" \
        S3_ENDPOINT="$S3_ENDPOINT" \
        S3_REGION="$S3_REGION" \
        S3_ACCESS_KEY="$S3_ACCESS_KEY" \
        S3_SECRET_KEY="$S3_SECRET_KEY" \
        S3_BUCKET="$S3_BUCKET"
    
    print_status "Deploying Worker..."
    fly deploy
    
    WORKER_URL=$(fly info --json | jq -r '.Hostname')
    print_success "Worker deployed successfully!"
    print_success "Worker URL: https://$WORKER_URL"
    
    cd ../..
    echo "$WORKER_URL" > .worker_url
}

# Update API with Worker URL
update_api_worker_url() {
    if [ -f ".worker_url" ]; then
        WORKER_URL=$(cat .worker_url)
        print_status "Updating API with Worker URL: $WORKER_URL"
        
        cd apps/api
        fly secrets set WORKER_BASE_URL="https://$WORKER_URL"
        cd ../..
        
        print_success "API updated with Worker URL"
    else
        print_warning "Worker URL not found. Please update manually."
    fi
}

# Deploy Frontend to Vercel
deploy_frontend() {
    print_status "Deploying Frontend to Vercel..."
    
    if [ -f ".api_url" ]; then
        API_URL=$(cat .api_url)
        print_status "Using API URL: https://$API_URL"
    else
        read -p "Enter your API URL (without https://): " API_URL
    fi
    
    cd apps/web
    
    if command -v vercel &> /dev/null; then
        print_status "Deploying with Vercel CLI..."
        vercel --prod
        
        print_status "Setting environment variable..."
        vercel env add NEXT_PUBLIC_API_BASE production
        echo "https://$API_URL" | vercel env add NEXT_PUBLIC_API_BASE production
        
        print_success "Frontend deployed successfully!"
    else
        print_warning "Vercel CLI not found. Please deploy manually:"
        echo "1. Go to https://vercel.com/dashboard"
        echo "2. Import your GitHub repository"
        echo "3. Set Root Directory to: apps/web"
        echo "4. Add environment variable: NEXT_PUBLIC_API_BASE = https://$API_URL"
        echo "5. Deploy"
    fi
    
    cd ../..
}

# Test deployment
test_deployment() {
    print_status "Testing deployment..."
    
    if [ -f ".api_url" ]; then
        API_URL=$(cat .api_url)
        print_status "Testing API health endpoint..."
        if curl -s "https://$API_URL/health" | grep -q "ok"; then
            print_success "API health check passed"
        else
            print_error "API health check failed"
        fi
    fi
    
    if [ -f ".worker_url" ]; then
        WORKER_URL=$(cat .worker_url)
        print_status "Testing Worker health endpoint..."
        if curl -s "https://$WORKER_URL/health" | grep -q "ok"; then
            print_success "Worker health check passed"
        else
            print_error "Worker health check failed"
        fi
    fi
}

# Main menu
main_menu() {
    echo
    echo "What would you like to do?"
    echo "1) Deploy API to Fly.io"
    echo "2) Deploy Worker to Fly.io"
    echo "3) Deploy Frontend to Vercel"
    echo "4) Deploy Everything (API + Worker + Frontend)"
    echo "5) Test Deployment"
    echo "6) Exit"
    echo
    read -p "Choose an option (1-6): " choice
    
    case $choice in
        1)
            check_dependencies
            deploy_api
            ;;
        2)
            check_dependencies
            deploy_worker
            ;;
        3)
            deploy_frontend
            ;;
        4)
            check_dependencies
            deploy_api
            deploy_worker
            update_api_worker_url
            deploy_frontend
            test_deployment
            ;;
        5)
            test_deployment
            ;;
        6)
            print_success "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid option. Please choose 1-6."
            main_menu
            ;;
    esac
}

# Check if running interactively
if [ -t 0 ]; then
    main_menu
else
    print_error "This script must be run interactively"
    exit 1
fi

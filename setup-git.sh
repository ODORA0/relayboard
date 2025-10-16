#!/bin/bash

# Relayboard Git Setup Script
# This script helps set up Git repository with proper remote configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_color $BLUE "🚀 Relayboard Git Repository Setup"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_color $RED "Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_color $YELLOW "Initializing Git repository..."
    git init
    print_color $GREEN "✅ Git repository initialized"
else
    print_color $GREEN "✅ Git repository already exists"
fi

# Add all files
print_color $YELLOW "Adding all files to Git..."
git add .
print_color $GREEN "✅ Files added to staging"

# Create initial commit
print_color $YELLOW "Creating initial commit..."
git commit -m "feat: initial Relayboard data pipeline platform

- Modern data pipeline automation platform
- CSV → PostgreSQL → dbt → Slack workflow
- Next.js web interface with Tailwind CSS
- NestJS API server with TypeScript
- Python/FastAPI worker for data processing
- Comprehensive documentation and deployment guides

Created by AJAL ODORA JONATHAN (@ODORA0)
GitHub: https://github.com/ODORA0"

print_color $GREEN "✅ Initial commit created"

# Set up remote repository
print_color $YELLOW "Setting up remote repository..."
git remote add origin https://github.com/ODORA0/relayboard.git
print_color $GREEN "✅ Remote repository configured"

# Create main branch
print_color $YELLOW "Setting up main branch..."
git branch -M main
print_color $GREEN "✅ Main branch configured"

print_color $BLUE "🎉 Git repository setup complete!"
echo ""
print_color $YELLOW "Next steps:"
echo "1. Push to GitHub: git push -u origin main"
echo "2. Create a new repository on GitHub if it doesn't exist"
echo "3. Update the remote URL if needed: git remote set-url origin <your-repo-url>"
echo ""
print_color $GREEN "Your Relayboard project is now ready for GitHub! 🚀"

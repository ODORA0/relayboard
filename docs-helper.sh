#!/bin/bash

# Relayboard Documentation Helper Script
# This script helps manage and view the project documentation

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

# Function to show help
show_help() {
    print_color $BLUE "Relayboard Documentation Helper"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  serve     Start a local documentation server"
    echo "  build     Build all documentation"
    echo "  check     Check documentation links and structure"
    echo "  open      Open documentation in browser"
    echo "  list      List all documentation files"
    echo "  help      Show this help message"
    echo ""
}

# Function to start documentation server
serve_docs() {
    print_color $GREEN "Starting documentation server..."
    
    # Check if Python is available
    if command -v python3 &> /dev/null; then
        print_color $YELLOW "Starting Python HTTP server on port 8080..."
        cd docs
        python3 -m http.server 8080
    elif command -v python &> /dev/null; then
        print_color $YELLOW "Starting Python HTTP server on port 8080..."
        cd docs
        python -m http.server 8080
    else
        print_color $RED "Python not found. Please install Python to serve documentation."
        exit 1
    fi
}

# Function to build documentation
build_docs() {
    print_color $GREEN "Building documentation..."
    
    # Check if all documentation files exist
    local docs_files=(
        "README.md"
        "docs/README.md"
        "docs/ARCHITECTURE.md"
        "docs/API.md"
        "docs/DEPLOYMENT.md"
    )
    
    for file in "${docs_files[@]}"; do
        if [ -f "$file" ]; then
            print_color $GREEN "✓ $file"
        else
            print_color $RED "✗ $file (missing)"
        fi
    done
    
    print_color $GREEN "Documentation build complete!"
}

# Function to check documentation
check_docs() {
    print_color $GREEN "Checking documentation..."
    
    # Check for broken links (basic check)
    local broken_links=0
    
    # Check if referenced files exist
    local referenced_files=(
        "docs/ARCHITECTURE.md"
        "docs/API.md"
        "docs/DEPLOYMENT.md"
        "docs/CONFIGURATION.md"
        "docs/TROUBLESHOOTING.md"
        "docs/DEVELOPMENT.md"
        "docs/CONTRIBUTING.md"
        "docs/TESTING.md"
        "docs/USER_MANUAL.md"
        "docs/PIPELINE_MANAGEMENT.md"
        "docs/SLACK_INTEGRATION.md"
    )
    
    for file in "${referenced_files[@]}"; do
        if [ -f "$file" ]; then
            print_color $GREEN "✓ $file"
        else
            print_color $YELLOW "⚠ $file (referenced but not created yet)"
        fi
    done
    
    print_color $GREEN "Documentation check complete!"
}

# Function to open documentation
open_docs() {
    print_color $GREEN "Opening documentation..."
    
    # Try to open the main README
    if [ -f "README.md" ]; then
        if command -v code &> /dev/null; then
            print_color $YELLOW "Opening in VS Code..."
            code README.md
        elif command -v open &> /dev/null; then
            print_color $YELLOW "Opening in default application..."
            open README.md
        elif command -v xdg-open &> /dev/null; then
            print_color $YELLOW "Opening in default application..."
            xdg-open README.md
        else
            print_color $RED "No suitable application found to open documentation."
        fi
    else
        print_color $RED "README.md not found!"
        exit 1
    fi
}

# Function to list documentation files
list_docs() {
    print_color $GREEN "Documentation files:"
    echo ""
    
    # List main documentation
    print_color $BLUE "Main Documentation:"
    find . -name "*.md" -not -path "./node_modules/*" -not -path "./.git/*" | sort
    
    echo ""
    print_color $BLUE "Documentation Structure:"
    if [ -d "docs" ]; then
        tree docs 2>/dev/null || find docs -type f | sort
    else
        print_color $YELLOW "docs/ directory not found"
    fi
}

# Main script logic
case "${1:-help}" in
    serve)
        serve_docs
        ;;
    build)
        build_docs
        ;;
    check)
        check_docs
        ;;
    open)
        open_docs
        ;;
    list)
        list_docs
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_color $RED "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac

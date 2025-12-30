#!/bin/bash
#
# AMSS Frontend Deployment Script
# Usage: ./scripts/deploy.sh [options]
#
# Options:
#   --build-only    Only build, don't deploy to k8s
#   --deploy-only   Only deploy to k8s, don't rebuild
#   --restart       Just restart the pod (pick up file changes)
#   --status        Show deployment status
#   --logs          Show pod logs
#   --help          Show this help message
#

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
WEB_ROOT="/var/www/amss"
NAMESPACE="amss-uat"
DEPLOYMENT_NAME="amss-frontend"
K8S_MANIFEST="$PROJECT_DIR/k8s/frontend.yaml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    head -20 "$0" | tail -n +2 | sed 's/^# //' | sed 's/^#//'
    exit 0
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi

    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi

    log_success "All prerequisites met"
}

build_frontend() {
    log_info "Building frontend..."
    cd "$PROJECT_DIR"

    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        npm install
    fi

    # Build
    log_info "Running production build..."
    npm run build

    # Copy to web root
    log_info "Copying build files to $WEB_ROOT..."
    sudo rm -rf "$WEB_ROOT"/*
    sudo cp -r dist/* "$WEB_ROOT/"

    log_success "Frontend built and copied to $WEB_ROOT"
}

deploy_to_k8s() {
    log_info "Deploying to Kubernetes..."

    # Check if manifest exists
    if [ ! -f "$K8S_MANIFEST" ]; then
        log_error "K8s manifest not found: $K8S_MANIFEST"
        exit 1
    fi

    # Apply manifest
    kubectl apply -f "$K8S_MANIFEST"

    log_success "Kubernetes resources applied"
}

restart_deployment() {
    log_info "Restarting deployment..."
    kubectl rollout restart deployment/$DEPLOYMENT_NAME -n $NAMESPACE

    log_info "Waiting for rollout to complete..."
    kubectl rollout status deployment/$DEPLOYMENT_NAME -n $NAMESPACE --timeout=120s

    log_success "Deployment restarted"
}

show_status() {
    echo ""
    log_info "=== Deployment Status ==="
    echo ""

    echo "Pods:"
    kubectl get pods -n $NAMESPACE -l app=$DEPLOYMENT_NAME
    echo ""

    echo "Service:"
    kubectl get svc -n $NAMESPACE $DEPLOYMENT_NAME
    echo ""

    echo "Ingress:"
    kubectl get ingress -n $NAMESPACE $DEPLOYMENT_NAME
    echo ""

    echo "Certificate:"
    kubectl get certificate -n $NAMESPACE -l app=$DEPLOYMENT_NAME 2>/dev/null || \
        kubectl get certificate -n $NAMESPACE ${DEPLOYMENT_NAME}-tls 2>/dev/null || \
        echo "No certificates found with app label"
    echo ""

    # Quick health check
    log_info "Health Check:"
    if curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://amss.leoulgirma.com/health 2>/dev/null | grep -q "200"; then
        log_success "Frontend is healthy (HTTPS)"
    else
        log_warning "Frontend health check failed or timed out"
    fi
}

show_logs() {
    log_info "Showing logs for $DEPLOYMENT_NAME..."
    kubectl logs -n $NAMESPACE -l app=$DEPLOYMENT_NAME --tail=100 -f
}

full_deploy() {
    check_prerequisites
    build_frontend
    deploy_to_k8s
    restart_deployment
    show_status
}

# Parse arguments
case "${1:-}" in
    --help|-h)
        show_help
        ;;
    --build-only)
        check_prerequisites
        build_frontend
        ;;
    --deploy-only)
        check_prerequisites
        deploy_to_k8s
        restart_deployment
        show_status
        ;;
    --restart)
        restart_deployment
        show_status
        ;;
    --status)
        show_status
        ;;
    --logs)
        show_logs
        ;;
    "")
        full_deploy
        ;;
    *)
        log_error "Unknown option: $1"
        show_help
        ;;
esac

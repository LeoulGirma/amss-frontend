# CI/CD Pipeline Setup

This document describes how to set up and use the CI/CD pipeline for the AMSS Frontend.

## Quick Start (TL;DR)

**Repository:** https://github.com/LeoulGirma/amss-frontend

**Add these secrets** at https://github.com/LeoulGirma/amss-frontend/settings/secrets/actions:

| Secret | Value |
|--------|-------|
| `SERVER_HOST` | `51.79.85.92` |
| `SERVER_USER` | `ubuntu` |
| `SSH_PRIVATE_KEY` | Contents of `~/.ssh/github_deploy` |

**Generate SSH key** (one-time):
```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_deploy  # Copy this to SSH_PRIVATE_KEY secret
```

**That's it!** Every push to `master` will auto-deploy to https://amss.leoulgirma.com

---

## Overview

The pipeline consists of three workflows:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **CI** | Push/PR to `master` | Lint, type check, build, test |
| **Deploy** | Push to `master` (after CI) | Deploy to production |
| **PR Check** | Pull requests | Bundle analysis, security audit |

## Pipeline Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Push/PR   │────▶│    Lint     │────▶│  TypeCheck  │────▶│    Build    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Verify    │◀────│   Restart   │◀────│   Deploy    │◀────│    Test     │
│   Health    │     │     K8s     │     │    Files    │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

## Current Configuration

### Production Environment

| Setting | Value |
|---------|-------|
| **Server** | `51.79.85.92` |
| **User** | `ubuntu` |
| **Deploy Path** | `/var/www/amss` |
| **K8s Namespace** | `amss-uat` |
| **K8s Deployment** | `amss-frontend` |
| **Live URL** | https://amss.leoulgirma.com |
| **Health Check** | https://amss.leoulgirma.com/health |

### GitHub Repository

| Setting | Value |
|---------|-------|
| **Repository** | https://github.com/LeoulGirma/amss-frontend |
| **Branch** | `master` |
| **Actions** | https://github.com/LeoulGirma/amss-frontend/actions |
| **Secrets** | https://github.com/LeoulGirma/amss-frontend/settings/secrets/actions |

---

## Required GitHub Secrets

Navigate to: **Repository → Settings → Secrets and variables → Actions**

### Secrets List

| Secret Name | Description | Current Value |
|-------------|-------------|---------------|
| `SERVER_HOST` | Production server IP | `51.79.85.92` |
| `SERVER_USER` | SSH username | `ubuntu` |
| `SSH_PRIVATE_KEY` | Ed25519 private key | `~/.ssh/github_deploy` |

### Setting Up SSH Keys

1. **Generate a deploy key** on the server:
   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy -N ""
   ```

2. **Add public key to authorized_keys**:
   ```bash
   cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
   ```

3. **Copy private key to GitHub**:
   ```bash
   cat ~/.ssh/github_deploy
   ```
   Copy the entire output (including `-----BEGIN/END-----` lines) to the `SSH_PRIVATE_KEY` secret.

### Verify Key Setup

```bash
# Test the key works locally
ssh -i ~/.ssh/github_deploy ubuntu@51.79.85.92 "echo 'SSH OK'"
```

---

## Workflow Files

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:** Push to `master`, Pull requests to `master`

**Jobs:**
- `lint-and-build`: ESLint, TypeScript check, Vite build
- `test`: Run test suite

**Steps:**
```
Checkout → Setup Node 20 → npm ci → Lint → TypeCheck → Build → Upload Artifacts → Test
```

### 2. Deploy Workflow (`.github/workflows/deploy.yml`)

**Triggers:** Push to `master` (after CI passes), Manual dispatch

**Jobs:**
- `ci`: Runs CI workflow first
- `deploy`: SSH deploy to production

**Steps:**
```
Download Artifacts → Setup SSH → Add Known Hosts → Rsync Files → Restart K8s → Verify Health
```

### 3. PR Check Workflow (`.github/workflows/pr-check.yml`)

**Triggers:** Pull requests to `master`

**Jobs:**
- `pr-info`: Build analysis, bundle size comment
- `security-check`: npm audit, secret scanning

---

## Manual Operations

### Trigger Manual Deployment

1. Go to https://github.com/LeoulGirma/amss-frontend/actions
2. Click **"Deploy to Production"**
3. Click **"Run workflow"**
4. Select branch and click **"Run workflow"**

### Deploy from Command Line

```bash
cd /home/ubuntu/amss-frontend

# Full deploy
./scripts/deploy.sh

# Build only
./scripts/deploy.sh --build-only

# Deploy only (skip build)
./scripts/deploy.sh --deploy-only

# Check status
./scripts/deploy.sh --status

# View logs
./scripts/deploy.sh --logs
```

### Rollback Deployment

```bash
# View deployment history
kubectl rollout history deployment/amss-frontend -n amss-uat

# Rollback to previous version
kubectl rollout undo deployment/amss-frontend -n amss-uat

# Rollback to specific revision
kubectl rollout undo deployment/amss-frontend -n amss-uat --to-revision=2
```

---

## Local Development

### Run CI Checks Locally

```bash
# Install dependencies
npm ci

# Run all checks
npm run lint && npm run typecheck && npm run build && npm test

# Fix lint issues
npm run lint:fix
```

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start dev server |
| `build` | `npm run build` | Production build |
| `lint` | `npm run lint` | Run ESLint |
| `lint:fix` | `npm run lint:fix` | Fix lint issues |
| `typecheck` | `npm run typecheck` | TypeScript check |
| `test` | `npm test` | Run tests |
| `deploy` | `npm run deploy` | Run deploy script |

---

## Troubleshooting

### CI Failures

**ESLint errors:**
```bash
npm run lint:fix
git add -A && git commit -m "Fix lint errors"
```

**TypeScript errors:**
```bash
npm run typecheck
# Review and fix type errors
```

**Build failures:**
```bash
rm -rf node_modules dist
npm ci
npm run build
```

### Deployment Failures

**SSH connection refused:**
```bash
# Check SSH service
sudo systemctl status sshd

# Check firewall
sudo ufw status

# Test key manually
ssh -i ~/.ssh/github_deploy -v ubuntu@51.79.85.92
```

**Rsync permission denied:**
```bash
# Check directory ownership
ls -la /var/www/amss

# Fix permissions
sudo chown -R ubuntu:ubuntu /var/www/amss
```

**Kubernetes restart fails:**
```bash
# Check pod status
kubectl get pods -n amss-uat -l app=amss-frontend

# Check events
kubectl get events -n amss-uat --sort-by='.lastTimestamp' | tail -20

# Check logs
kubectl logs -n amss-uat -l app=amss-frontend --tail=50
```

### Health Check Fails

```bash
# Check pod is running
kubectl get pods -n amss-uat -l app=amss-frontend

# Check service
kubectl get svc -n amss-uat amss-frontend

# Check ingress
kubectl get ingress -n amss-uat amss-frontend

# Test health endpoint
curl -v https://amss.leoulgirma.com/health
```

---

## Monitoring

### GitHub Actions

- **All Runs:** https://github.com/LeoulGirma/amss-frontend/actions
- **CI Runs:** https://github.com/LeoulGirma/amss-frontend/actions/workflows/ci.yml
- **Deploy Runs:** https://github.com/LeoulGirma/amss-frontend/actions/workflows/deploy.yml

### Server Monitoring

```bash
# Deployment status
kubectl get pods -n amss-uat -l app=amss-frontend -w

# Resource usage
kubectl top pods -n amss-uat

# Recent logs
kubectl logs -n amss-uat -l app=amss-frontend --tail=100 -f
```

---

## Security Best Practices

1. **Never commit secrets** - Use GitHub Secrets
2. **Rotate SSH keys** - Regenerate deploy keys periodically
3. **Use environment protection** - Add required reviewers for production
4. **Monitor deployments** - Review Actions logs for anomalies
5. **Limit key permissions** - Deploy key only needs access to `/var/www/amss`

---

## Adding Staging Environment

To add a staging environment:

1. **Create new secrets:**
   - `SERVER_HOST_STAGING`
   - `SERVER_USER_STAGING`
   - `SSH_PRIVATE_KEY_STAGING`

2. **Create staging namespace:**
   ```bash
   kubectl create namespace amss-staging
   ```

3. **Deploy staging manifests:**
   ```bash
   kubectl apply -f k8s/frontend.yaml -n amss-staging
   ```

4. **Update deploy.yml** to support environment selection

5. **Create staging ingress** with staging domain

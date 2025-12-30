# CI/CD Pipeline Setup

This document describes how to set up and use the CI/CD pipeline for the AMSS Frontend.

## Overview

The pipeline consists of two workflows:

1. **CI (Continuous Integration)** - Runs on every push and PR
   - Linting (ESLint)
   - Type checking (TypeScript)
   - Building
   - Testing

2. **Deploy (Continuous Deployment)** - Runs after CI passes on `main` branch
   - Downloads build artifacts
   - Deploys to production server via SSH
   - Restarts Kubernetes deployment
   - Verifies deployment health

## Pipeline Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Push/PR   │────▶│    Lint     │────▶│    Build    │────▶│    Test     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
                                                            ┌─────────────┐
                                                            │   Deploy    │
                                                            │ (main only) │
                                                            └─────────────┘
```

## Required GitHub Secrets

Navigate to your repository → Settings → Secrets and variables → Actions

### Required Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SSH_PRIVATE_KEY` | Private SSH key for server access | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SERVER_HOST` | Production server IP/hostname | `51.79.85.92` |
| `SERVER_USER` | SSH username | `ubuntu` |

### Setting Up SSH Keys

1. **Generate a new SSH key pair** (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key
   ```

2. **Add the public key to the server**:
   ```bash
   # On your local machine
   cat ~/.ssh/github_deploy_key.pub

   # On the server, add to authorized_keys
   echo "ssh-ed25519 AAAA... github-actions-deploy" >> ~/.ssh/authorized_keys
   ```

3. **Add the private key to GitHub Secrets**:
   ```bash
   cat ~/.ssh/github_deploy_key
   # Copy the entire output including BEGIN and END lines
   ```

   Go to GitHub → Repository → Settings → Secrets → New repository secret
   - Name: `SSH_PRIVATE_KEY`
   - Value: Paste the private key

4. **Add server details**:
   - Name: `SERVER_HOST`, Value: `51.79.85.92`
   - Name: `SERVER_USER`, Value: `ubuntu`

## Environment Protection Rules (Recommended)

For additional security, set up environment protection:

1. Go to Repository → Settings → Environments
2. Create a `production` environment
3. Add protection rules:
   - Required reviewers (for manual approval)
   - Wait timer (optional delay before deploy)
   - Deployment branches (restrict to `main`)

## Manual Deployment

You can trigger a deployment manually:

1. Go to Actions → Deploy to Production
2. Click "Run workflow"
3. Select the branch and environment
4. Click "Run workflow"

## Workflow Files

### CI Workflow (`.github/workflows/ci.yml`)

Triggers on:
- Push to `main`
- Pull requests to `main`

Jobs:
1. `lint-and-build`: Lints, type checks, and builds the project
2. `test`: Runs test suite (after build succeeds)

### Deploy Workflow (`.github/workflows/deploy.yml`)

Triggers on:
- Push to `main` (after CI passes)
- Manual trigger via `workflow_dispatch`

Jobs:
1. `ci`: Runs the CI workflow
2. `deploy`: Deploys to production server

## Local Development

### Running CI Checks Locally

```bash
# Install dependencies
npm ci

# Run linting
npm run lint

# Type check
npx tsc --noEmit

# Build
npm run build

# Run tests
npm test
```

### Testing Deployment Script

```bash
# Use the deploy script
./scripts/deploy.sh

# Or run individual steps
./scripts/deploy.sh --build-only
./scripts/deploy.sh --deploy-only
./scripts/deploy.sh --status
```

## Troubleshooting

### CI Failures

**ESLint errors:**
```bash
# Fix auto-fixable issues
npm run lint -- --fix
```

**TypeScript errors:**
```bash
# Check specific errors
npx tsc --noEmit
```

**Build failures:**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm ci
npm run build
```

### Deployment Failures

**SSH connection issues:**
- Verify the SSH key is correct
- Check server firewall allows SSH (port 22)
- Ensure the public key is in `~/.ssh/authorized_keys` on server

**Kubernetes errors:**
```bash
# Check pod status
kubectl get pods -n amss-uat

# Check logs
kubectl logs -n amss-uat -l app=amss-frontend

# Check events
kubectl get events -n amss-uat --sort-by='.lastTimestamp'
```

**Rsync failures:**
- Ensure deploy path exists: `/var/www/amss`
- Check directory permissions

## Monitoring Deployments

### GitHub Actions UI
- View workflow runs at: `https://github.com/<owner>/<repo>/actions`
- Each run shows detailed logs for each step

### Server-side Verification
```bash
# Check deployment status
kubectl get pods -n amss-uat -l app=amss-frontend

# Check health endpoint
curl https://amss.leoulgirma.com/health

# View recent logs
kubectl logs -n amss-uat -l app=amss-frontend --tail=50
```

## Security Best Practices

1. **Never commit secrets** - Use GitHub Secrets for all sensitive data
2. **Use environment protection** - Require approvals for production deploys
3. **Rotate SSH keys** - Periodically rotate deployment keys
4. **Limit SSH access** - The deploy key should only have access to required directories
5. **Monitor deployments** - Review deployment logs for anomalies

## Adding New Environments

To add a staging environment:

1. Create new secrets with `_STAGING` suffix:
   - `SSH_PRIVATE_KEY_STAGING`
   - `SERVER_HOST_STAGING`
   - `SERVER_USER_STAGING`

2. Modify `deploy.yml` to handle environment selection

3. Create a new Kubernetes namespace (e.g., `amss-staging`)

4. Update ingress for staging domain

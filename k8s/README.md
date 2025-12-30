# Kubernetes Manifests

This directory contains Kubernetes manifests for deploying the AMSS frontend.

## Files

- `frontend.yaml` - Main deployment manifest containing:
  - ConfigMap (nginx configuration)
  - Deployment (nginx container serving static files)
  - Service (ClusterIP)
  - Ingress (with TLS via cert-manager)

## Quick Deploy

```bash
# From project root
./scripts/deploy.sh

# Or apply manually
kubectl apply -f k8s/frontend.yaml
```

## Deployment Options

```bash
# Full deploy (build + deploy + restart)
./scripts/deploy.sh

# Build only (no k8s deployment)
./scripts/deploy.sh --build-only

# Deploy only (assumes build exists)
./scripts/deploy.sh --deploy-only

# Restart pod only (pick up new files)
./scripts/deploy.sh --restart

# Show status
./scripts/deploy.sh --status

# Stream logs
./scripts/deploy.sh --logs
```

## Manual Operations

```bash
# Apply manifests
kubectl apply -f k8s/frontend.yaml

# Restart deployment
kubectl rollout restart deployment/amss-frontend -n amss-uat

# Check status
kubectl get pods -n amss-uat -l app=amss-frontend

# View logs
kubectl logs -n amss-uat -l app=amss-frontend -f

# Delete all resources
kubectl delete -f k8s/frontend.yaml
```

## Customization

### Change Domain

Edit `frontend.yaml`:
```yaml
spec:
  tls:
  - hosts:
    - your-new-domain.com  # Change this
    secretName: your-new-tls-secret
  rules:
  - host: your-new-domain.com  # And this
```

### Change Replicas

Edit `frontend.yaml`:
```yaml
spec:
  replicas: 3  # Change from 1
```

Or use kubectl:
```bash
kubectl scale deployment amss-frontend -n amss-uat --replicas=3
```

### Change Resource Limits

Edit `frontend.yaml`:
```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "200m"
```

## Troubleshooting

See [KUBERNETES_DEPLOYMENT.md](../docs/KUBERNETES_DEPLOYMENT.md) for detailed troubleshooting guide.

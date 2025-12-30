# AMSS Kubernetes Deployment Guide

This guide covers deploying and managing the AMSS application on Kubernetes (k3s).

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Current Infrastructure](#current-infrastructure)
4. [Deploying the Frontend](#deploying-the-frontend)
5. [Deploying the Backend](#deploying-the-backend)
6. [Managing Ingress & SSL](#managing-ingress--ssl)
7. [Common Operations](#common-operations)
8. [Troubleshooting](#troubleshooting)
9. [Extending the Setup](#extending-the-setup)

---

## Architecture Overview

```
                                    ┌─────────────────────────────────────────┐
                                    │              Kubernetes (k3s)           │
                                    │                                         │
  Internet                          │  ┌─────────────────────────────────┐   │
     │                              │  │     ingress-nginx-controller     │   │
     │                              │  │        (ports 80, 443)           │   │
     ▼                              │  └──────────────┬──────────────────┘   │
┌─────────┐                         │                 │                       │
│   DNS   │                         │    ┌────────────┴────────────┐         │
│ Records │                         │    │                         │         │
└────┬────┘                         │    ▼                         ▼         │
     │                              │  ┌─────────────┐    ┌─────────────┐    │
     │  amss.leoulgirma.com ────────┼─▶│  Frontend   │    │   Backend   │◀───┼── amss-api-uat.duckdns.org
     │  amss-api-uat.duckdns.org ───┼──┼─────────────┼───▶│   (Go API)  │    │
     │                              │  │  (nginx)    │    └──────┬──────┘    │
     │                              │  └─────────────┘           │           │
     │                              │                            ▼           │
     │                              │                    ┌─────────────┐     │
     │                              │                    │  PostgreSQL │     │
     │                              │                    │    Redis    │     │
     │                              │                    └─────────────┘     │
     │                              │                     (Docker on host)   │
     │                              └─────────────────────────────────────────┘
     │
     └──────────────────────────────▶ 51.79.85.92 (Host IP)
```

### Components

| Component | Type | Namespace | Description |
|-----------|------|-----------|-------------|
| Frontend | Deployment | amss-uat | React SPA served by nginx |
| Backend | Deployment | amss-uat | Go API server |
| Ingress Controller | DaemonSet | ingress-nginx | nginx ingress handling SSL/routing |
| Cert Manager | Deployment | cert-manager | Automatic SSL certificate management |
| PostgreSQL | Docker | host | Database (external to k8s) |
| Redis | Docker | host | Cache/session store (external to k8s) |

---

## Prerequisites

### Required Tools

```bash
# kubectl - Kubernetes CLI
kubectl version --client

# helm - Kubernetes package manager
helm version

# Check cluster access
kubectl cluster-info
```

### Verify Cluster Status

```bash
# Check all nodes are ready
kubectl get nodes

# Check all system pods are running
kubectl get pods -A

# Check namespaces
kubectl get namespaces
```

---

## Current Infrastructure

### Namespaces

```bash
# List namespaces
kubectl get namespaces

# Current namespaces:
# - amss-uat        : AMSS application (frontend + backend)
# - ingress-nginx   : Ingress controller
# - cert-manager    : SSL certificate management
# - monitoring      : Prometheus/Grafana stack
```

### View All Resources in amss-uat

```bash
# Get all resources
kubectl get all -n amss-uat

# Get detailed view
kubectl get pods,svc,ingress,configmap,secret -n amss-uat
```

---

## Deploying the Frontend

### Step 1: Build the Frontend

```bash
cd /home/ubuntu/amss-frontend

# Install dependencies
npm install

# Build for production
npm run build

# Copy build files to web root
sudo cp -r dist/* /var/www/amss/
```

### Step 2: Create Kubernetes Manifests

Create a file `k8s/frontend.yaml`:

```yaml
---
# ConfigMap for nginx configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: amss-frontend-nginx-config
  namespace: amss-uat
data:
  default.conf: |
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_proxied any;
        gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;

        # Handle SPA routing - all routes go to index.html
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets (1 year)
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Don't cache index.html
        location = /index.html {
            expires -1;
            add_header Cache-Control "no-store, no-cache, must-revalidate";
        }
    }

---
# Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: amss-frontend
  namespace: amss-uat
  labels:
    app: amss-frontend
spec:
  replicas: 1
  selector:
    matchLabels:
      app: amss-frontend
  template:
    metadata:
      labels:
        app: amss-frontend
    spec:
      containers:
      - name: nginx
        image: nginx:alpine
        ports:
        - containerPort: 80
        volumeMounts:
        - name: frontend-files
          mountPath: /usr/share/nginx/html
          readOnly: true
        - name: nginx-config
          mountPath: /etc/nginx/conf.d/default.conf
          subPath: default.conf
          readOnly: true
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
      volumes:
      - name: frontend-files
        hostPath:
          path: /var/www/amss
          type: Directory
      - name: nginx-config
        configMap:
          name: amss-frontend-nginx-config

---
# Service
apiVersion: v1
kind: Service
metadata:
  name: amss-frontend
  namespace: amss-uat
  labels:
    app: amss-frontend
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 80
    protocol: TCP
    name: http
  selector:
    app: amss-frontend

---
# Ingress with SSL
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: amss-frontend
  namespace: amss-uat
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - amss.leoulgirma.com
    secretName: amss-frontend-tls
  rules:
  - host: amss.leoulgirma.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: amss-frontend
            port:
              number: 80
```

### Step 3: Deploy to Kubernetes

```bash
# Apply the manifests
kubectl apply -f k8s/frontend.yaml

# Verify deployment
kubectl get pods -n amss-uat -l app=amss-frontend

# Check logs
kubectl logs -n amss-uat -l app=amss-frontend

# Verify ingress
kubectl get ingress -n amss-uat

# Check certificate status
kubectl get certificate -n amss-uat
```

### Step 4: Verify Deployment

```bash
# Test HTTP (should redirect to HTTPS)
curl -I http://amss.leoulgirma.com

# Test HTTPS
curl -I https://amss.leoulgirma.com

# Check SSL certificate
echo | openssl s_client -connect amss.leoulgirma.com:443 -servername amss.leoulgirma.com 2>/dev/null | openssl x509 -noout -dates
```

---

## Deploying the Backend

### Current Backend Deployment

The backend is already deployed. Here's the structure for reference:

```yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: amss-server
  namespace: amss-uat
spec:
  replicas: 1
  selector:
    matchLabels:
      app: amss-server
  template:
    metadata:
      labels:
        app: amss-server
    spec:
      containers:
      - name: amss-server
        image: amss-server:latest
        imagePullPolicy: Never  # Use local image
        ports:
        - containerPort: 8080
        env:
        - name: DB_HOST
          value: "host.docker.internal"  # Or use host IP
        - name: DB_PORT
          value: "5455"
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: amss-secrets
              key: db-user
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: amss-secrets
              key: db-password
        - name: REDIS_HOST
          value: "host.docker.internal"
        - name: REDIS_PORT
          value: "6379"
```

### View Backend Resources

```bash
# Get backend pods
kubectl get pods -n amss-uat -l app=amss-server

# View backend logs
kubectl logs -n amss-uat -l app=amss-server --tail=100

# Describe deployment
kubectl describe deployment amss-server -n amss-uat
```

---

## Managing Ingress & SSL

### Ingress Controller

The nginx ingress controller handles all incoming traffic on ports 80 and 443.

```bash
# Check ingress controller status
kubectl get pods -n ingress-nginx

# View ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx --tail=50

# List all ingress resources
kubectl get ingress -A
```

### SSL Certificates with cert-manager

Certificates are automatically managed by cert-manager using Let's Encrypt.

```bash
# Check cert-manager pods
kubectl get pods -n cert-manager

# List all certificates
kubectl get certificates -A

# Check certificate details
kubectl describe certificate amss-frontend-tls -n amss-uat

# View certificate secret
kubectl get secret amss-frontend-tls -n amss-uat -o yaml
```

### ClusterIssuer Configuration

The Let's Encrypt issuer is already configured:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@amss-api-uat.duckdns.org
    privateKeySecretRef:
      name: letsencrypt-prod-key
    solvers:
    - http01:
        ingress:
          class: nginx
```

### Adding a New Domain

To add a new subdomain with SSL:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-new-service
  namespace: amss-uat
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - newservice.leoulgirma.com  # Your new domain
    secretName: newservice-tls    # Certificate will be stored here
  rules:
  - host: newservice.leoulgirma.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-new-service
            port:
              number: 80
```

---

## Common Operations

### Updating the Frontend

```bash
# 1. Build new version
cd /home/ubuntu/amss-frontend
npm run build

# 2. Copy to web root
sudo cp -r dist/* /var/www/amss/

# 3. Restart the pod to pick up changes
kubectl rollout restart deployment amss-frontend -n amss-uat

# 4. Watch the rollout
kubectl rollout status deployment amss-frontend -n amss-uat
```

### Scaling Deployments

```bash
# Scale up
kubectl scale deployment amss-frontend -n amss-uat --replicas=3

# Scale down
kubectl scale deployment amss-frontend -n amss-uat --replicas=1

# Auto-scaling (HPA)
kubectl autoscale deployment amss-frontend -n amss-uat --min=1 --max=5 --cpu-percent=80
```

### Viewing Logs

```bash
# Frontend logs
kubectl logs -n amss-uat -l app=amss-frontend -f

# Backend logs
kubectl logs -n amss-uat -l app=amss-server -f

# Ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx -f

# All pods in namespace
kubectl logs -n amss-uat --all-containers=true -f
```

### Checking Resource Usage

```bash
# Pod resource usage
kubectl top pods -n amss-uat

# Node resource usage
kubectl top nodes

# Detailed pod info
kubectl describe pod -n amss-uat -l app=amss-frontend
```

### Executing Commands in Pods

```bash
# Get shell access
kubectl exec -it -n amss-uat deployment/amss-frontend -- /bin/sh

# Run a specific command
kubectl exec -n amss-uat deployment/amss-frontend -- ls -la /usr/share/nginx/html

# Check nginx config
kubectl exec -n amss-uat deployment/amss-frontend -- nginx -T
```

### Debugging Failed Pods

```bash
# Get pod status
kubectl get pods -n amss-uat

# Describe pod for events
kubectl describe pod <pod-name> -n amss-uat

# Get previous logs (if pod crashed)
kubectl logs <pod-name> -n amss-uat --previous

# Check events
kubectl get events -n amss-uat --sort-by='.lastTimestamp'
```

---

## Troubleshooting

### Pod Won't Start

```bash
# Check pod status
kubectl get pods -n amss-uat

# Common statuses:
# - Pending: Waiting for resources or scheduling
# - ImagePullBackOff: Can't pull container image
# - CrashLoopBackOff: Container keeps crashing
# - Error: Container exited with error

# Get details
kubectl describe pod <pod-name> -n amss-uat

# Check events
kubectl get events -n amss-uat --field-selector type=Warning
```

### Ingress Not Working

```bash
# Check ingress status
kubectl get ingress -n amss-uat

# Verify ingress controller is running
kubectl get pods -n ingress-nginx

# Check ingress controller logs for errors
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx | grep -i error

# Test from inside cluster
kubectl run test --rm -it --image=busybox -- wget -qO- http://amss-frontend.amss-uat.svc.cluster.local
```

### SSL Certificate Issues

```bash
# Check certificate status
kubectl get certificates -n amss-uat

# If not ready, check certificate request
kubectl get certificaterequest -n amss-uat

# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager

# Check challenges (for HTTP-01 validation)
kubectl get challenges -n amss-uat

# Force certificate renewal
kubectl delete secret amss-frontend-tls -n amss-uat
# cert-manager will automatically create a new certificate
```

### DNS Issues

```bash
# Check DNS resolution from inside cluster
kubectl run test --rm -it --image=busybox -- nslookup amss.leoulgirma.com

# Check external DNS
dig amss.leoulgirma.com
nslookup amss.leoulgirma.com
```

### Network Connectivity

```bash
# Test service connectivity from inside cluster
kubectl run test --rm -it --image=busybox -- wget -qO- http://amss-frontend.amss-uat.svc.cluster.local

# Check service endpoints
kubectl get endpoints -n amss-uat

# Check if service is routing to pods
kubectl describe svc amss-frontend -n amss-uat
```

---

## Extending the Setup

### Adding a New Microservice

1. **Create Deployment and Service:**

```yaml
# k8s/my-service.yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-service
  namespace: amss-uat
  labels:
    app: my-service
spec:
  replicas: 1
  selector:
    matchLabels:
      app: my-service
  template:
    metadata:
      labels:
        app: my-service
    spec:
      containers:
      - name: my-service
        image: my-service:latest
        imagePullPolicy: Never
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: my-service
  namespace: amss-uat
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3000
  selector:
    app: my-service
```

2. **Add Ingress (if external access needed):**

```yaml
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-service
  namespace: amss-uat
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - myservice.leoulgirma.com
    secretName: my-service-tls
  rules:
  - host: myservice.leoulgirma.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-service
            port:
              number: 80
```

3. **Deploy:**

```bash
kubectl apply -f k8s/my-service.yaml
```

### Adding Environment-Specific Configs

Use ConfigMaps for non-sensitive config and Secrets for sensitive data:

```yaml
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-service-config
  namespace: amss-uat
data:
  API_URL: "https://amss-api-uat.duckdns.org"
  LOG_LEVEL: "info"
  FEATURE_FLAGS: |
    {
      "newFeature": true,
      "betaFeature": false
    }

---
apiVersion: v1
kind: Secret
metadata:
  name: my-service-secrets
  namespace: amss-uat
type: Opaque
stringData:
  API_KEY: "your-api-key-here"
  DB_PASSWORD: "your-db-password"
```

Reference in deployment:

```yaml
env:
- name: API_URL
  valueFrom:
    configMapKeyRef:
      name: my-service-config
      key: API_URL
- name: API_KEY
  valueFrom:
    secretKeyRef:
      name: my-service-secrets
      key: API_KEY
```

### Adding Persistent Storage

```yaml
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-service-data
  namespace: amss-uat
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
  storageClassName: local-path  # k3s default storage class
```

Use in deployment:

```yaml
volumeMounts:
- name: data
  mountPath: /app/data
volumes:
- name: data
  persistentVolumeClaim:
    claimName: my-service-data
```

### Setting Up a CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup-job
  namespace: amss-uat
spec:
  schedule: "0 2 * * *"  # Run at 2 AM daily
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:16
            command:
            - /bin/sh
            - -c
            - |
              pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > /backup/backup-$(date +%Y%m%d).sql
            env:
            - name: DB_HOST
              value: "172.17.0.1"
            - name: DB_USER
              value: "amss"
            - name: DB_NAME
              value: "amss"
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: amss-secrets
                  key: db-password
          restartPolicy: OnFailure
```

### Adding Monitoring (ServiceMonitor)

If using Prometheus:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: my-service
  namespace: amss-uat
  labels:
    release: kube-prometheus-stack
spec:
  selector:
    matchLabels:
      app: my-service
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
```

---

## Quick Reference

### Useful Commands Cheatsheet

```bash
# ===== PODS =====
kubectl get pods -n amss-uat                    # List pods
kubectl logs -f <pod> -n amss-uat               # Stream logs
kubectl exec -it <pod> -n amss-uat -- /bin/sh   # Shell access
kubectl delete pod <pod> -n amss-uat            # Delete pod (will restart)

# ===== DEPLOYMENTS =====
kubectl get deployments -n amss-uat             # List deployments
kubectl rollout restart deployment/<name> -n amss-uat  # Restart
kubectl rollout status deployment/<name> -n amss-uat   # Check status
kubectl rollout undo deployment/<name> -n amss-uat     # Rollback

# ===== SERVICES =====
kubectl get svc -n amss-uat                     # List services
kubectl describe svc <name> -n amss-uat         # Service details
kubectl get endpoints -n amss-uat               # Service endpoints

# ===== INGRESS =====
kubectl get ingress -n amss-uat                 # List ingress
kubectl describe ingress <name> -n amss-uat     # Ingress details

# ===== CERTIFICATES =====
kubectl get certificates -n amss-uat            # List certs
kubectl get certificaterequest -n amss-uat      # Cert requests
kubectl delete secret <tls-secret> -n amss-uat  # Force cert renewal

# ===== CONFIG =====
kubectl get configmap -n amss-uat               # List configmaps
kubectl get secret -n amss-uat                  # List secrets

# ===== DEBUGGING =====
kubectl describe pod <pod> -n amss-uat          # Pod details
kubectl get events -n amss-uat                  # Namespace events
kubectl top pods -n amss-uat                    # Resource usage
```

### File Locations

| Item | Location |
|------|----------|
| Frontend source | `/home/ubuntu/amss-frontend/` |
| Frontend build | `/var/www/amss/` |
| Backend source | `/home/ubuntu/amss-backend/` |
| K8s manifests | `/tmp/amss-frontend-k8s.yaml` |
| Nginx config | ConfigMap `amss-frontend-nginx-config` |

### URLs

| Service | URL |
|---------|-----|
| Frontend | https://amss.leoulgirma.com |
| API | https://amss-api-uat.duckdns.org/api/v1 |
| Grafana | http://51.79.85.92:30080 (via NodePort) |

---

## Support

For issues or questions:
1. Check pod logs: `kubectl logs -n amss-uat -l app=<app-name>`
2. Check events: `kubectl get events -n amss-uat`
3. Describe resources: `kubectl describe <resource> -n amss-uat`

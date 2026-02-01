# Frontend API Integration & SSL Setup

This document covers the changes made to integrate the AMSS frontend with the real backend API, fix the demo mode login loop, and set up HTTPS with Let's Encrypt.

## Summary of Changes

| Area | What Changed | Benefit |
|------|-------------|---------|
| Demo Mode Login | Skip token validation for demo tokens | Users can browse demo mode without being logged out on page reload |
| Compliance Page | Connected to `/compliance-items` API | Real compliance data shown for authenticated users; sign-off actions persist |
| Notifications | Removed hardcoded mock data from initial state | Real users start with an empty inbox instead of fake notifications |
| Kanban Board | Connected to `/maintenance-tasks` API | Drag-and-drop state transitions persist via API; real task data displayed |
| HTTPS/SSL | Let's Encrypt cert configured in SafeLine WAF | Site accessible securely at `https://amss.leoulgirma.com` |

---

## 1. Demo Mode Login Fix

### Problem

Clicking "Try Demo Mode" on the login page stored a fake token (`demo-token-<timestamp>`) in localStorage. On page reload, `ProtectedRoute` called the `/auth/me` endpoint with this fake token, received a 401, and the reauth logic dispatched `logout()` -- kicking the user back to login in an infinite loop.

### What Changed

**`src/features/auth/protected-route.tsx`**

- Added demo token detection: tokens starting with `demo-token-` are recognized as demo sessions.
- `useGetMeQuery` is skipped for demo tokens so no API call is made.
- The session is immediately marked as initialized, preventing the logout redirect.

**`src/lib/api.ts`** (`baseQueryWithReauth`)

- If the current Redux token starts with `demo-token-`, the base query returns early with a non-401 error instead of hitting the API.
- This prevents any RTK Query hook from accidentally triggering a 401 -> refresh -> logout chain in demo mode.

### How It Works

```
Page reload with demo token
  -> ProtectedRoute detects demo token
  -> Skips /auth/me call
  -> Sets isInitialized = true
  -> User stays logged in with demo data
```

### Benefit

Demo mode now works reliably across page reloads and navigation. Users can explore all features without being kicked back to login.

---

## 2. Compliance Page API Integration

### Problem

The compliance page (`src/features/compliance/compliance-page.tsx`) used only hardcoded `mockComplianceItems`. The "Mark as Compliant" button had no functionality. Real authenticated users saw the same fake data as demo users.

### What Changed

**`src/features/compliance/compliance-page.tsx`**

- Added `useGetComplianceItemsQuery` with `skip: isDemo` -- fetches real compliance items from the API when authenticated.
- Added `useSignOffComplianceItemMutation` -- the "Mark as Compliant" button now calls `PATCH /compliance-items/{id}/sign-off`.
- Added a `transformComplianceItem()` function that maps the API schema (`ApiComplianceItem`) to the frontend display type (`ComplianceItem`):
  - `result: 'pass'` -> `status: 'compliant'`
  - `result: 'fail'` -> `status: 'overdue'`
  - `result: 'pending'` -> `status: 'pending'`
  - `signed_off: true` overrides status to `'compliant'`
- Demo mode still shows mock data with a "(Demo Data)" label.

### Pattern Used

Follows the same `isDemo` pattern established in `maintenance-page.tsx`:

```typescript
const { orgId, isAuthenticated } = useAppSelector((state) => state.auth)
const isDemo = !isAuthenticated || !orgId

const { data: apiItems, isLoading } = useGetComplianceItemsQuery({}, { skip: isDemo })

const complianceItems = isDemo ? mockComplianceItems : (apiItems || []).map(transformComplianceItem)
```

### Benefit

Authenticated users see real compliance data from the backend. Sign-off actions are persisted through the API. Demo users still get a functional preview with mock data.

---

## 3. Notifications Integration

### Problem

The notifications Redux slice (`src/features/notifications/notifications-slice.ts`) initialized with hardcoded `mockNotifications` in its `initialState`. Every user -- real or demo -- saw the same fake notifications on first load.

### What Changed

**`src/features/notifications/notifications-slice.ts`**

- Changed `initialState.notifications` from `mockNotifications` to an empty array `[]`.
- Changed `initialState.unreadCount` from the mock count to `0`.
- Added a `loadDemoNotifications` reducer action that populates state with the mock data on demand.
- Exported `loadDemoNotifications` alongside existing actions.

**`src/features/auth/login-page.tsx`**

- After dispatching `setCredentials` in `handleDemoMode`, now also dispatches `loadDemoNotifications()`.
- This ensures demo users still see sample notifications, while real users start clean.

### Benefit

Real authenticated users start with an empty notification inbox (ready for real notifications from the backend). Demo users get mock notifications loaded at login time, keeping the demo experience intact.

---

## 4. Kanban Board API Integration

### Problem

The kanban board (`src/features/maintenance/kanban-board.tsx`) used only `mockTasks` in local React state. Dragging tasks between columns only updated local state -- nothing persisted. Real authenticated users saw the same hardcoded demo tasks.

### What Changed

**`src/features/maintenance/kanban-board.tsx`**

- Added `useGetTasksQuery` and `useGetAircraftListQuery` with `skip: isDemo` to fetch real task and aircraft data.
- Added `useTransitionTaskStateMutation` for persisting drag-and-drop state changes.
- Created `transformTaskForKanban()` function that maps `ApiTask` + `ApiAircraft` to the frontend `MaintenanceTask` type:
  - Maps API `state` (scheduled/in_progress/completed) to frontend `status`
  - Maps API `type` (inspection/repair/overhaul) to frontend maintenance type
  - Computes `estimatedHours` from the time range
  - Resolves aircraft `tail_number` and `model` from the aircraft list
- Drag-and-drop behavior:
  - **Demo mode**: Updates local state only (same as before).
  - **Authenticated mode**: Calls `PATCH /maintenance-tasks/{id}/state` with the new state, with error handling and toast feedback.

### Benefit

Authenticated users see their real maintenance tasks on the kanban board. Dragging a task between columns (e.g., Scheduled -> In Progress) persists the state change through the API. Demo mode continues to work with local-only mock data.

---

## 5. HTTPS/SSL Setup

### Problem

`https://amss.leoulgirma.com` failed with a TLS handshake error (`packet length too long`). SafeLine WAF was listening on port 443 but had no SSL certificate configured, so it responded with plain HTTP on the TLS port.

### What Was Done

1. **Installed certbot** on the server:
   ```bash
   sudo apt-get install -y certbot
   ```

2. **Obtained a Let's Encrypt certificate** using the webroot method (SafeLine proxies HTTP requests to the backend nginx which serves from `/var/www/amss`):
   ```bash
   sudo certbot certonly --webroot -w /var/www/amss -d amss.leoulgirma.com \
     --non-interactive --agree-tos --email admin@leoulgirma.com
   ```

3. **Inserted the certificate into SafeLine's database** (`mgt_ssl_cert` table in the `safeline-ce` PostgreSQL database):
   ```bash
   sudo docker exec safeline-pg psql -U safeline-ce safeline-ce -c "
     INSERT INTO mgt_ssl_cert (name, domain, issuer, self_signature, trusted,
       revoked, expired, cert_type, valid_before, cert_content, key_content,
       created_at, updated_at)
     VALUES ('amss.leoulgirma.com', '[\"amss.leoulgirma.com\"]',
       'Let''s Encrypt E8', false, true, false, false, 1,
       '2026-04-28T03:18:05Z', '<fullchain.pem content>', '<privkey.pem content>',
       NOW(), NOW());
   "
   ```

4. **Linked the certificate to the website** in SafeLine's `mgt_website` table:
   ```bash
   sudo docker exec safeline-pg psql -U safeline-ce safeline-ce -c "
     UPDATE mgt_website SET cert_id = 1, cert_type = 1, updated_at = NOW()
     WHERE id = 3;
   "
   ```

5. **Restarted SafeLine's tengine** to reload the configuration:
   ```bash
   sudo docker restart safeline-tengine
   ```

### Certificate Details

| Field | Value |
|-------|-------|
| Domain | `amss.leoulgirma.com` |
| Issuer | Let's Encrypt E8 |
| Type | ECDSA (EC key) |
| Valid Until | April 28, 2026 |
| Auto-Renewal | Enabled via certbot systemd timer |

### Certificate Renewal

Certbot automatically set up a systemd timer for renewal. When the cert renews, the new cert files need to be re-inserted into SafeLine's database. To automate this, a post-renewal hook can be added at `/etc/letsencrypt/renewal-hooks/deploy/`.

### Benefit

The site is now accessible securely over HTTPS with a valid, trusted Let's Encrypt certificate. Browsers no longer show security warnings, and all traffic is encrypted.

---

## Architecture Overview

```
Browser (HTTPS)
    |
    v
SafeLine WAF (port 443, SSL termination)
    |
    v
Nginx (port 8080, serves /var/www/amss)
    |
    v
Static SPA files (Vite build output)
    |
    v (API calls from browser)
Backend API (port 8080, /api/v1/*)
```

## Files Modified

| File | Changes |
|------|---------|
| `src/lib/api.ts` | Demo token short-circuit in `baseQueryWithReauth` |
| `src/features/auth/protected-route.tsx` | Skip `useGetMeQuery` for demo tokens |
| `src/features/auth/login-page.tsx` | Dispatch `loadDemoNotifications` on demo login |
| `src/features/compliance/compliance-page.tsx` | API integration with `useGetComplianceItemsQuery`, sign-off mutation, transform function |
| `src/features/notifications/notifications-slice.ts` | Empty initial state, `loadDemoNotifications` action |
| `src/features/maintenance/kanban-board.tsx` | API integration with `useGetTasksQuery`, `useTransitionTaskStateMutation`, transform function |

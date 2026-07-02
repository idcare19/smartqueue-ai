# API Documentation

## Health
- `GET /health/`
- `GET /api/health/`
- `GET /api/health/db/`
- `GET /api/health/redis/`
- `GET /api/health/celery/`
- `GET /api/health/websocket/`
- `GET /api/version/`
- `GET /api/info/`

## Auth
- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `POST /api/auth/logout/`
- `POST /api/auth/forgot-password/`
- `POST /api/auth/reset-password/`
- `POST /api/auth/verify-email/`

## Organizations
- `GET /api/organizations/`
- `POST /api/organizations/`
- `PATCH /api/organizations/:id/`
- `POST /api/organizations/:id/restore/`

## Branches
- `GET /api/branches/`
- `POST /api/branches/`
- `PATCH /api/branches/:id/`
- `POST /api/branches/:id/restore/`

## Queue
- `POST /api/queue-tokens/join/`
- `POST /api/queue-tokens/call-next/`
- `POST /api/queue-tokens/:id/recall/`
- `POST /api/queue-tokens/:id/skip/`
- `POST /api/queue-tokens/:id/complete/`
- `POST /api/queue-tokens/:id/no-show/`
- `POST /api/queue-tokens/:id/pause/`
- `POST /api/queue-tokens/:id/resume/`
- `POST /api/queue-tokens/open/`
- `POST /api/queue-tokens/close/`

## Notifications
- `GET /api/notifications/`
- `POST /api/notifications/:id/read/`
- `POST /api/notifications/mark-all-read/`
- `POST /api/notifications/:id/retry/`
- `GET /api/notification-stats/`
- `GET /api/notification-providers/`

## Reports
- `GET /api/reports/export/?type=queue&format=csv`
- `GET /api/reports/export/?type=analytics&format=pdf`
- `GET /api/reports/export/?type=staff&format=xlsx`

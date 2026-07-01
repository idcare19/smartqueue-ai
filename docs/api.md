# API Blueprint

## Auth

- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `POST /api/auth/logout/`

## Organizations

- `GET /api/organizations/`
- `POST /api/organizations/`
- `GET /api/organizations/:id/branches/`

## Queue

- `POST /api/queues/join/`
- `POST /api/queues/:token/call-next/`
- `POST /api/queues/:token/complete/`
- `GET /api/display/:branchId/`


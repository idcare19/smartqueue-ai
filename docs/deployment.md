# Deployment Guide

## Backend
- Deploy `backend/` as a Django service.
- Use Redis for Celery and Channels in production.
- Set `DJANGO_SECRET_KEY`, `ALLOWED_HOSTS`, and `FRONTEND_URL`.

## Frontend
- Deploy `frontend/` to Vercel.
- Set `NEXT_PUBLIC_API_BASE_URL` to the backend URL.

## Container
- Use `backend/Dockerfile` for the API.
- Use `docker-compose.yml` for local production-style validation.

## Health Checks
- `GET /api/health/`
- `GET /api/version/`
- `GET /api/info/`

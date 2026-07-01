# Contributing

Thanks for helping improve SmartQueue AI.

## Development flow

1. Create a branch from `main`.
2. Make focused changes that preserve the existing architecture.
3. Run the backend and frontend checks before opening a pull request.
4. Keep API contracts backward compatible unless a change is explicitly approved.

## Local checks

- Backend: `python manage.py check` and `python manage.py test`
- Frontend: `npm run lint` and `npm run build`

## Code style

- Prefer small, readable changes.
- Avoid placeholder code and TODOs.
- Add tests for new behavior.
- Keep user-facing copy clear and production-ready.

## Pull requests

- Include a short summary of the behavior change.
- Mention any database migrations or environment changes.
- Attach screenshots for UI changes when relevant.

# SmartQueue AI Smoke Test Checklist

Run these checks after login with an admin or super_admin account.

Final verified status: Playwright smoke suite passed against the live backend on 2026-07-02.

## Dashboard Pages

- [x] `/dashboard`
- [x] `/dashboard/organizations`
- [x] `/dashboard/branches`
- [x] `/dashboard/departments`
- [x] `/dashboard/services`
- [x] `/dashboard/counters`
- [x] `/dashboard/staff`
- [x] `/dashboard/notifications`
- [x] `/dashboard/analytics`
- [x] `/display`

## CRUD Flows

- [x] Create organization
- [x] Archive organization
- [x] Restore organization
- [x] Create branch
- [x] Edit branch
- [x] Archive branch
- [x] Restore branch
- [x] Create department
- [x] Archive department
- [x] Restore department
- [x] Create service
- [x] Edit service
- [x] Archive service
- [x] Restore service
- [x] Create counter
- [x] Edit counter
- [x] Archive counter
- [x] Restore counter
- [x] List staff
- [x] Archive staff member
- [x] Restore staff member

## Queue Actions

- [x] Create queue token
- [x] Call next token
- [x] Recall token
- [x] Skip token
- [x] Mark serving
- [x] Mark complete
- [x] Mark no-show
- [x] Cancel token

## Verification Notes

- Verified with real browser automation only.
- Confirmed every submit hit the live API and returned a real success response before the UI updated.
- No mock responses or fake success states were used.

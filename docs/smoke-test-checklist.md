# SmartQueue AI Smoke Test Checklist

Run these checks after login with an admin or super_admin account.

## Dashboard Pages

- [ ] `/dashboard`
- [ ] `/dashboard/organizations`
- [ ] `/dashboard/branches`
- [ ] `/dashboard/departments`
- [ ] `/dashboard/services`
- [ ] `/dashboard/counters`
- [ ] `/dashboard/staff`
- [ ] `/dashboard/notifications`
- [ ] `/dashboard/analytics`
- [ ] `/display`

## CRUD Flows

- [ ] Create organization
- [ ] Archive organization
- [ ] Restore organization
- [ ] Create branch
- [ ] Edit branch
- [ ] Archive branch
- [ ] Restore branch
- [ ] Create department
- [ ] Archive department
- [ ] Restore department
- [ ] Create service
- [ ] Edit service
- [ ] Archive service
- [ ] Restore service
- [ ] Create counter
- [ ] Edit counter
- [ ] Archive counter
- [ ] Restore counter
- [ ] List staff
- [ ] Archive staff member
- [ ] Restore staff member

## Queue Actions

- [ ] Create queue token
- [ ] Call next token
- [ ] Recall token
- [ ] Skip token
- [ ] Mark serving
- [ ] Mark complete
- [ ] Mark no-show
- [ ] Cancel token

## Verification Notes

- Record any failed request with its HTTP status code.
- Capture backend traceback for any 5xx response.
- Confirm every successful submit updates the UI from a real API response.

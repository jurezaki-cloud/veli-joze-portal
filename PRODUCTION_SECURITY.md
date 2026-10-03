# Production security gate

## Public member data
Only expose: id, display_name/nickname and zone when show_zone=true.

## Private member data
Never expose through public endpoints: email, parcel_private, role internals, session/auth data.

## Required before launch
- Dedicated Veli Jože authentication provider
- Dedicated PostgreSQL database
- Strong AUTH_SECRET
- Google OAuth credentials only if Google login is enabled
- Server-side session validation on every write endpoint
- Role checks for moderator/admin actions
- Member approval before community write access
- Rate limiting for login, registration, chat and reports
- CSRF/origin protection where applicable
- Audit log for moderation
- Database backups and restore test
- Privacy notice and community rules
- No production secrets committed to Git

## Launch rule
Do not remove DEMO labels or enable writes until authentication, database persistence and authorization are verified end-to-end.

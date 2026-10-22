-- Delete service requests older than the configured retention window (730 days).
-- Run against the intended database only:
-- npx wrangler d1 execute promovers --remote --file scripts/delete-expired-requests.sql
DELETE FROM service_requests
WHERE created_at < datetime('now', '-730 days');

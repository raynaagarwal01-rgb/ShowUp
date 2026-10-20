-- =============================================================================
-- LOCAL DEVELOPMENT ONLY — deletes every ShowUp table and all of its data.
--
-- Use this when moving a local database from the old schema (profiles,
-- sessions, password_resets, teammate_listings, VARCHAR ids ...) to the new
-- 8-table schema, or whenever you want a clean slate:
--
--   npm run db:reset           (reset.sql -> schema.sql -> seed.sql)
--
-- Never run this against a shared or production database.
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Current schema
DROP TABLE IF EXISTS event_winners;
DROP TABLE IF EXISTS event_questions;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

-- Tables that only existed in the old schema
DROP TABLE IF EXISTS teammate_listings;
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS profiles;

SET FOREIGN_KEY_CHECKS = 1;

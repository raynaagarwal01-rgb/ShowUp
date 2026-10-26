-- Destructive local-development reset: removes all users, events and registrations.
-- Never run this against a database whose data you need to keep.
USE showup;
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

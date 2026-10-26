-- =============================================================================
-- ShowUp — Read-Only Practice Queries for Learners
--
-- These queries demonstrate table inspection, filtering, JOINs, aggregation
-- with GROUP BY, and post-aggregation filtering with HAVING.
--
-- Runner selects the database automatically.
-- All queries are read-only (SELECT, SHOW, DESCRIBE).
-- =============================================================================

-- 1. Inspect tables and column definitions
-- SHOW TABLES lists all existing tables in the database.
-- DESCRIBE displays column names, data types, nullability, keys, and defaults.
SHOW TABLES;
DESCRIBE users;
DESCRIBE events;
DESCRIBE registrations;

-- 2. Upcoming events
-- Filters events scheduled in the future using UTC_TIMESTAMP() and sorts by date.
SELECT id, title, event_date, venue
FROM events
WHERE event_date >= UTC_TIMESTAMP()
ORDER BY event_date;

-- 3. Event organizers (INNER JOIN)
-- JOIN combines rows from events and users where the organizer_id matches users.id,
-- allowing us to display the organizer's human-readable name alongside the event title.
SELECT e.title, u.name AS organizer
FROM events e
JOIN users u ON u.id = e.organizer_id;

-- 4. Registration totals per event (LEFT JOIN + GROUP BY)
-- LEFT JOIN ensures events with zero registrations are still included in the result.
-- GROUP BY collapses matching rows by event id and title so COUNT(r.id) calculates
-- the total number of confirmed registrations for each event.
SELECT e.id, e.title, COUNT(r.id) AS registered
FROM events e
LEFT JOIN registrations r ON r.event_id = e.id AND r.status = 'confirmed'
GROUP BY e.id, e.title;

-- 5. Attendance list for checked-in attendees (Multiple JOINs)
-- JOIN connects registrations with both events and users to show who checked in
-- and for which event. WHERE filters only registrations that have a check-in timestamp.
SELECT e.title, u.name, r.checked_in_at
FROM registrations r
JOIN events e ON e.id = r.event_id
JOIN users u ON u.id = r.user_id
WHERE r.checked_in_at IS NOT NULL;

-- 6. Events with available places (LEFT JOIN + GROUP BY + HAVING)
-- GROUP BY aggregates confirmed registrations per event.
-- HAVING filters the grouped results after aggregation to keep only events where
-- the capacity minus registered count (places_left) is strictly greater than 0.
SELECT e.title, e.capacity - COUNT(r.id) AS places_left
FROM events e
LEFT JOIN registrations r ON r.event_id = e.id AND r.status = 'confirmed'
GROUP BY e.id, e.title, e.capacity
HAVING places_left > 0;

-- 7. Account lookup (Read-only safe profile lookup)
-- Retrieves user details by email. Sensitive fields like password_hash and
-- session_token_hash are deliberately excluded from the SELECT column list.
SELECT id, name, email, role
FROM users
WHERE email = 'ananya@showup.local';

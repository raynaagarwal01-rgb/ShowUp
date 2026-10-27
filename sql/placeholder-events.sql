-- Safe to rerun: creates only the locked demo organizer and missing sample events.
-- Run with: node server/run-sql.js placeholder-events.sql
SET time_zone = '+00:00';

INSERT INTO users (name, email, password_hash, role, college)
SELECT 'ShowUp Demo Events', 'placeholder-events@showup.invalid', '!', 'organizer', 'ShowUp Campus'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'placeholder-events@showup.invalid'
);

INSERT INTO events
  (organizer_id, title, description, category, venue, event_date, registration_deadline, capacity, fee)
SELECT organizer.id, sample.title, sample.description, sample.category, sample.venue,
       TIMESTAMP(DATE_ADD(UTC_DATE(), INTERVAL sample.event_days DAY), sample.start_time),
       TIMESTAMP(DATE_ADD(UTC_DATE(), INTERVAL sample.deadline_days DAY), '23:59:00'),
       sample.capacity, sample.fee
FROM (
  SELECT 'CodeSprint' AS title, 'Build and demo a useful campus software prototype with a small team. Placeholder event for demonstration only.' AS description,
         'Hackathon' AS category, 'Technology Tower, Innovation Lab' AS venue, 6 AS event_days, 4 AS deadline_days, '09:00:00' AS start_time, 80 AS capacity, 0 AS fee
  UNION ALL SELECT 'Robotics Buildathon', 'Prototype a small robot, then share your design and build process. Placeholder event for demonstration only.',
         'Hackathon', 'Central Workshop, Robotics Lab', 24, 21, '10:00:00', 60, 150
  UNION ALL SELECT 'Build with SQL', 'Practice designing tables and writing queries in a friendly guided lab. Placeholder event for demonstration only.',
         'Workshop', 'SJT Computer Lab 3', 8, 6, '14:00:00', 40, 50
  UNION ALL SELECT 'Design to React', 'Turn a simple interface mockup into a responsive React page. Placeholder event for demonstration only.',
         'Workshop', 'Technology Tower, Studio 2', 16, 13, '13:00:00', 50, 100
  UNION ALL SELECT 'Campus Quiz Bowl', 'Team up for a lighthearted quiz across science, arts, and campus life. Placeholder event for demonstration only.',
         'Competition', 'Anna Auditorium, Seminar Room A', 10, 8, '15:00:00', 120, 0
  UNION ALL SELECT 'Photography Walk', 'Explore campus photo spots and submit one image for a friendly student showcase. Placeholder event for demonstration only.',
         'Competition', 'Main Quad, Student Activity Center', 20, 17, '16:00:00', 70, 50
  UNION ALL SELECT 'Open Mic Evening', 'Share music, poetry, or short stories in a relaxed student open mic. Placeholder event for demonstration only.',
         'Cultural', 'Open Air Theatre', 12, 9, '18:00:00', 150, 0
  UNION ALL SELECT 'Campus Arts Fest', 'Enjoy student music, dance, and art displays in an afternoon campus gathering. Placeholder event for demonstration only.',
         'Cultural', 'Student Activity Center, Main Hall', 28, 25, '17:00:00', 200, 100
  UNION ALL SELECT 'Alumni Career Stories', 'Hear recent graduates share practical lessons from their first roles after college. Placeholder event for demonstration only.',
         'Talk', 'Anna Auditorium', 14, 11, '16:30:00', 180, 0
  UNION ALL SELECT 'Startup Fireside', 'Join alumni founders for a conversation about testing ideas and building early teams. Placeholder event for demonstration only.',
         'Talk', 'Technology Tower, Lecture Hall 1', 30, 27, '17:30:00', 100, 150
) AS sample
JOIN users AS organizer
  ON organizer.email = 'placeholder-events@showup.invalid'
 AND organizer.name = 'ShowUp Demo Events'
 AND organizer.role = 'organizer'
 AND organizer.college = 'ShowUp Campus'
 AND organizer.password_hash = '!'
WHERE NOT EXISTS (
  SELECT 1 FROM events AS existing
  WHERE existing.organizer_id = organizer.id AND existing.title = sample.title
);

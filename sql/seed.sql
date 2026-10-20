-- =============================================================================
-- ShowUp — sample data for a fresh LOCAL database.
--
--   npm run db:seed            (after npm run db:init)
--   npm run db:reset           (drops, re-creates and seeds in one go)
--
-- Ids are written out explicitly so the foreign keys below are easy to follow.
-- Event dates are relative to today, so the demo always has upcoming events.
--
-- Every demo account uses the password:  password123
-- (password_hash is the bcrypt hash of that string — demo data only.)
-- =============================================================================

SET time_zone = '+00:00';

-- users ------------------------------------------------------------------------
INSERT INTO users (id, name, email, password_hash, role, college, reg_no) VALUES
  (1, 'Code Cell',               'codecell@showup.local', '$2b$10$A8P.F0HhSJ.HqKeLrQHHNOFSvUSm0QmY9jDYdDvV9RH01ol1YVPk6', 'organizer', 'VIT Vellore', NULL),
  (2, 'Cultural & Esports Club', 'culturals@showup.local', '$2b$10$A8P.F0HhSJ.HqKeLrQHHNOFSvUSm0QmY9jDYdDvV9RH01ol1YVPk6', 'organizer', 'VIT Chennai', NULL),
  (3, 'Robotics Club',           'robotics@showup.local',  '$2b$10$A8P.F0HhSJ.HqKeLrQHHNOFSvUSm0QmY9jDYdDvV9RH01ol1YVPk6', 'organizer', 'IIT Madras',  NULL),
  (4, 'Ananya Sharma',   'ananya@showup.local', '$2b$10$A8P.F0HhSJ.HqKeLrQHHNOFSvUSm0QmY9jDYdDvV9RH01ol1YVPk6', 'student', 'VIT Vellore', '25BCE0101'),
  (5, 'Rohan Mehta',     'rohan@showup.local',  '$2b$10$A8P.F0HhSJ.HqKeLrQHHNOFSvUSm0QmY9jDYdDvV9RH01ol1YVPk6', 'student', 'VIT Vellore', '25BCE0102'),
  (6, 'Priya Patel',     'priya@showup.local',  '$2b$10$A8P.F0HhSJ.HqKeLrQHHNOFSvUSm0QmY9jDYdDvV9RH01ol1YVPk6', 'student', 'VIT Chennai', '24BIT0456'),
  (7, 'Vikram Malhotra', 'vikram@showup.local', '$2b$10$A8P.F0HhSJ.HqKeLrQHHNOFSvUSm0QmY9jDYdDvV9RH01ol1YVPk6', 'student', 'IIT Madras',  'CS24B031'),
  (8, 'Sameer Khan',     'sameer@showup.local', '$2b$10$A8P.F0HhSJ.HqKeLrQHHNOFSvUSm0QmY9jDYdDvV9RH01ol1YVPk6', 'student', 'VIT Vellore', '25BEC0210');

-- events (organizer_id -> users.id) ----------------------------------------------
INSERT INTO events (id, organizer_id, title, description, category, venue, event_date, registration_deadline, capacity, fee, team_min, team_max) VALUES
  (1, 1, 'CodeSprint 24',
   'Form a team of 2-4 and build a working prototype in 24 hours straight. Mentors drop by every few hours, and judges from local startups score the final demos.\n\nRules: all code must be written during the event; open-source libraries are allowed; submit a GitHub link and a 3-minute demo.',
   'Hackathon', 'Technology Tower, Innovation Lab',
   TIMESTAMP(CURDATE() + INTERVAL 6 DAY, '09:00:00'), TIMESTAMP(CURDATE() + INTERVAL 5 DAY, '23:59:00'), 40, 0, 2, 4),
  (2, 1, 'Figma to Front-End',
   'A hands-on workshop on building a component library in Figma and shipping it as a real design system in React. Bring a laptop with Figma and Node.js installed.',
   'Workshop', 'SJT Seminar Hall 2',
   TIMESTAMP(CURDATE() + INTERVAL 3 DAY, '14:00:00'), TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '23:59:00'), 60, 0, 1, 1),
  (3, 2, 'Valorant 5v5 Showdown',
   'Register your 5-person squad (plus up to 2 substitutes) for a single-elimination LAN bracket with live commentary on the big screen.',
   'Competition', 'Student Activity Center',
   TIMESTAMP(CURDATE() + INTERVAL 10 DAY, '10:00:00'), TIMESTAMP(CURDATE() + INTERVAL 8 DAY, '23:59:00'), 70, 100, 5, 7),
  (4, 2, 'Battle of the Bands',
   'Six bands, one stage, one winner. Each band gets a 15-minute set judged on composition, stage presence and crowd response.',
   'Cultural', 'Open Air Theatre',
   TIMESTAMP(CURDATE() + INTERVAL 14 DAY, '18:00:00'), TIMESTAMP(CURDATE() + INTERVAL 11 DAY, '23:59:00'), 48, 0, 3, 8),
  (5, 1, 'Founders\' Fireside',
   'An informal fireside chat with two alumni who founded and funded early-stage startups, with an open Q&A for the last 20 minutes.',
   'Talk', 'Anna Auditorium',
   TIMESTAMP(CURDATE() + INTERVAL 9 DAY, '17:00:00'), TIMESTAMP(CURDATE() + INTERVAL 9 DAY, '12:00:00'), 120, 0, 1, 1),
  (6, 3, 'Line Follower Championship',
   'Build an autonomous line-following bot and race it across an obstacle-laced track. Fastest clean run wins. Teams of up to 3.',
   'Competition', 'Robotics Lab, Central Workshop',
   TIMESTAMP(CURDATE() + INTERVAL 20 DAY, '10:00:00'), TIMESTAMP(CURDATE() + INTERVAL 17 DAY, '23:59:00'), 30, 150, 1, 3),
  (7, 1, 'Hack Night 2026',
   'An overnight mini-hackathon that already happened — open the Winners tab to see the results.',
   'Hackathon', 'Technology Tower, Innovation Lab',
   TIMESTAMP(CURDATE() - INTERVAL 10 DAY, '20:00:00'), TIMESTAMP(CURDATE() - INTERVAL 12 DAY, '23:59:00'), 30, 0, 2, 3);

-- teams (event_id -> events.id, leader_id -> users.id) ---------------------------
INSERT INTO teams (id, event_id, name, join_code, leader_id) VALUES
  (1, 1, 'NeuralCraft', 'NC8821', 4),
  (2, 6, 'BotBusters',  'BB4910', 7),
  (3, 7, 'ByteForge',   'BF2201', 4);

-- team_members (many-to-many: users <-> teams) -----------------------------------
INSERT INTO team_members (team_id, user_id) VALUES
  (1, 4), (1, 5),
  (2, 7),
  (3, 4), (3, 5), (3, 8);

-- registrations (one row per participant, team members included) ----------------
INSERT INTO registrations (id, user_id, event_id, team_id, status, checked_in_at) VALUES
  (1, 4, 1, 1,    'confirmed', NULL),
  (2, 5, 1, 1,    'confirmed', NULL),
  (3, 6, 2, NULL, 'confirmed', NULL),
  (4, 8, 2, NULL, 'confirmed', NULL),
  (5, 7, 6, 2,    'confirmed', NULL),
  (6, 4, 7, 3,    'confirmed', TIMESTAMP(CURDATE() - INTERVAL 10 DAY, '19:45:00')),
  (7, 5, 7, 3,    'confirmed', TIMESTAMP(CURDATE() - INTERVAL 10 DAY, '19:50:00')),
  (8, 8, 7, 3,    'confirmed', TIMESTAMP(CURDATE() - INTERVAL 10 DAY, '19:52:00')),
  (9, 6, 5, NULL, 'cancelled', NULL);

-- announcements ------------------------------------------------------------------
INSERT INTO announcements (event_id, title, content) VALUES
  (1, 'Mentor schedule is out', 'Mentors will visit every team at 12 PM, 4 PM and 8 PM. Keep your GitHub repo ready.'),
  (1, 'Registration desk timing', 'The registration desk at Technology Tower opens at 8:00 AM. Carry your college ID.'),
  (7, 'Results announced', 'Thanks to everyone who stayed up all night! The winners are listed in the Winners tab.');

-- event_questions ----------------------------------------------------------------
INSERT INTO event_questions (event_id, user_id, question, answer) VALUES
  (1, 6, 'Can first-year students participate?', 'Yes! CodeSprint is open to students from every year.'),
  (1, 8, 'Will food be provided overnight?', NULL),
  (2, 4, 'Do we need prior React experience?', 'No — basic HTML and CSS is enough.');

-- event_winners ------------------------------------------------------------------
INSERT INTO event_winners (event_id, position, winner_name, prize) VALUES
  (7, 1, 'ByteForge', 'Rs. 10,000'),
  (7, 2, 'Team Quantum', 'Rs. 5,000'),
  (7, 3, 'Null Pointers', 'Goodies'),
  (7, 4, 'Best UI: Pixel Pushers', NULL);

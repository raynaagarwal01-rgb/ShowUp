-- Sample accounts all use the password password123.
-- Dates stay relative to today; run `npm run db:seed` after `npm run db:init`.
SET time_zone = '+00:00';

INSERT INTO users (id, name, email, password_hash, role, college, reg_no) VALUES
  (1, 'Code Cell', 'codecell@showup.local', '$2b$10$Xz6h6ClCY6VxS3T2KnTYD.IrZWW47Dos4kr8VCWiBpvZzYu4zvWoG', 'organizer', 'VIT Vellore', NULL),
  (2, 'Cultural Club', 'culturals@showup.local', '$2b$10$Xz6h6ClCY6VxS3T2KnTYD.IrZWW47Dos4kr8VCWiBpvZzYu4zvWoG', 'organizer', 'VIT Chennai', NULL),
  (3, 'Ananya Sharma', 'ananya@showup.local', '$2b$10$Xz6h6ClCY6VxS3T2KnTYD.IrZWW47Dos4kr8VCWiBpvZzYu4zvWoG', 'student', 'VIT Vellore', '25BCE0101'),
  (4, 'Rohan Mehta', 'rohan@showup.local', '$2b$10$Xz6h6ClCY6VxS3T2KnTYD.IrZWW47Dos4kr8VCWiBpvZzYu4zvWoG', 'student', 'VIT Vellore', '25BCE0102'),
  (5, 'Priya Patel', 'priya@showup.local', '$2b$10$Xz6h6ClCY6VxS3T2KnTYD.IrZWW47Dos4kr8VCWiBpvZzYu4zvWoG', 'student', 'VIT Chennai', '24BIT0456'),
  (6, 'Vikram Malhotra', 'vikram@showup.local', '$2b$10$Xz6h6ClCY6VxS3T2KnTYD.IrZWW47Dos4kr8VCWiBpvZzYu4zvWoG', 'student', 'IIT Madras', 'CS24B031');

INSERT INTO events (id, organizer_id, title, description, category, venue, event_date, registration_deadline, capacity, fee) VALUES
  (1, 1, 'CodeSprint', 'Build and present a working software prototype in one day.', 'Hackathon', 'Technology Tower, Innovation Lab', TIMESTAMP(CURDATE() + INTERVAL 6 DAY, '09:00:00'), TIMESTAMP(CURDATE() + INTERVAL 5 DAY, '23:59:00'), 40, 0),
  (2, 1, 'Figma to Front-End', 'A hands-on workshop on turning a design system into a React interface.', 'Workshop', 'SJT Seminar Hall 2', TIMESTAMP(CURDATE() + INTERVAL 3 DAY, '14:00:00'), TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '23:59:00'), 60, 0),
  (3, 2, 'Valorant Showdown', 'Register as an individual player for a single-elimination LAN bracket.', 'Competition', 'Student Activity Center', TIMESTAMP(CURDATE() + INTERVAL 10 DAY, '10:00:00'), TIMESTAMP(CURDATE() + INTERVAL 8 DAY, '23:59:00'), 70, 100),
  (4, 2, 'Battle of the Bands', 'Perform a 15-minute set judged on composition, stage presence, and crowd response.', 'Cultural', 'Open Air Theatre', TIMESTAMP(CURDATE() + INTERVAL 14 DAY, '18:00:00'), TIMESTAMP(CURDATE() + INTERVAL 11 DAY, '23:59:00'), 48, 0),
  (5, 1, 'Founders’ Fireside', 'An informal conversation with two alumni founders and an open audience Q&A.', 'Talk', 'Anna Auditorium', TIMESTAMP(CURDATE() + INTERVAL 9 DAY, '17:00:00'), TIMESTAMP(CURDATE() + INTERVAL 8 DAY, '12:00:00'), 120, 0),
  (6, 2, 'Line Follower Championship', 'Build an autonomous line-following bot and race it across an obstacle course.', 'Competition', 'Robotics Lab, Central Workshop', TIMESTAMP(CURDATE() + INTERVAL 20 DAY, '10:00:00'), TIMESTAMP(CURDATE() + INTERVAL 17 DAY, '23:59:00'), 30, 150),
  (7, 1, 'Hack Night', 'A past overnight build event with individual participant check-ins.', 'Hackathon', 'Technology Tower, Innovation Lab', TIMESTAMP(CURDATE() - INTERVAL 10 DAY, '20:00:00'), TIMESTAMP(CURDATE() - INTERVAL 12 DAY, '23:59:00'), 30, 0);

INSERT INTO registrations (id, user_id, event_id, status, checked_in_at) VALUES
  (1, 3, 1, 'confirmed', NULL),
  (2, 4, 1, 'confirmed', NULL),
  (3, 5, 2, 'confirmed', NULL),
  (4, 6, 2, 'confirmed', NULL),
  (5, 3, 7, 'confirmed', TIMESTAMP(CURDATE() - INTERVAL 10 DAY, '19:45:00')),
  (6, 4, 7, 'confirmed', TIMESTAMP(CURDATE() - INTERVAL 10 DAY, '19:50:00')),
  (7, 5, 5, 'cancelled', NULL);

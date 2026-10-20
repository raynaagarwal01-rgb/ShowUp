-- =============================================================================
-- ShowUp — MySQL 8 schema (8 tables)
--
--   npm run db:init            (uses the DB_* settings in .env)
--   mysql -u root -p < sql/schema.sql
--
-- Every statement is CREATE ... IF NOT EXISTS, so this file never deletes data
-- and is safe to re-run. To wipe a LOCAL development database and start over,
-- see sql/reset.sql (npm run db:reset).
--
-- Tables are created parent-first so every FOREIGN KEY points at a table that
-- already exists:
--   users -> events -> teams -> team_members -> registrations
--         -> announcements -> event_questions -> event_winners
-- =============================================================================

CREATE DATABASE IF NOT EXISTS showup CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE showup;

-- 1. users ---------------------------------------------------------------------
-- Students and organizers share one table; `role` tells them apart.
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,                      -- bcrypt hash, never the password
  role          ENUM('student', 'organizer') NOT NULL DEFAULT 'student',
  college       VARCHAR(150) NULL,
  reg_no        VARCHAR(30)  NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- 2. events --------------------------------------------------------------------
-- One organizer (users) has many events.
CREATE TABLE IF NOT EXISTS events (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  organizer_id          INT          NOT NULL,
  title                 VARCHAR(200) NOT NULL,
  description           TEXT         NOT NULL,
  category              VARCHAR(50)  NOT NULL,
  venue                 VARCHAR(200) NOT NULL,
  event_date            DATETIME     NOT NULL,
  registration_deadline DATETIME     NOT NULL,
  capacity              INT          NOT NULL,                -- max confirmed participants (people, not teams)
  fee                   INT          NOT NULL DEFAULT 0,      -- informational only, no payments
  team_min              INT          NOT NULL DEFAULT 1,
  team_max              INT          NOT NULL DEFAULT 1,      -- 1 = solo event
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organizer_id) REFERENCES users (id) ON DELETE CASCADE,
  CHECK (capacity > 0),
  CHECK (fee >= 0),
  CHECK (team_min >= 1 AND team_max >= team_min)
) ENGINE = InnoDB;

-- 3. teams ---------------------------------------------------------------------
-- One event has many teams. join_code is unique across the whole site so a
-- code alone identifies the team (POST /api/teams/join).
CREATE TABLE IF NOT EXISTS teams (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  event_id   INT          NOT NULL,
  name       VARCHAR(100) NOT NULL,
  join_code  VARCHAR(10)  NOT NULL UNIQUE,
  leader_id  INT          NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (event_id, name),                                  -- no two teams with the same name in one event
  FOREIGN KEY (event_id)  REFERENCES events (id) ON DELETE CASCADE,
  FOREIGN KEY (leader_id) REFERENCES users (id)  ON DELETE CASCADE
) ENGINE = InnoDB;

-- 4. team_members --------------------------------------------------------------
-- Junction table: the many-to-many relationship between users and teams.
CREATE TABLE IF NOT EXISTS team_members (
  team_id   INT       NOT NULL,
  user_id   INT       NOT NULL,
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, user_id),                           -- composite key: a person joins a team once
  FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- 5. registrations -------------------------------------------------------------
-- Junction table between users and events (many-to-many). Every participant,
-- including each team member, has their own row — so capacity is simply
-- COUNT(*) of confirmed rows. The row id is printed in the QR ticket, and
-- checked_in_at records attendance.
CREATE TABLE IF NOT EXISTS registrations (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  event_id      INT NOT NULL,
  team_id       INT NULL,                                   -- NULL for solo registrations
  status        ENUM('confirmed', 'cancelled') NOT NULL DEFAULT 'confirmed',
  checked_in_at DATETIME  NULL,
  registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, event_id),                               -- no duplicate registrations
  FOREIGN KEY (user_id)  REFERENCES users (id)  ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  FOREIGN KEY (team_id)  REFERENCES teams (id)  ON DELETE SET NULL
) ENGINE = InnoDB;

-- 6. announcements -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcements (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  event_id   INT          NOT NULL,
  title      VARCHAR(150) NOT NULL,
  content    TEXT         NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- 7. event_questions -----------------------------------------------------------
-- answer stays NULL until the event's organizer replies.
CREATE TABLE IF NOT EXISTS event_questions (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  event_id   INT       NOT NULL,
  user_id    INT       NOT NULL,
  question   TEXT      NOT NULL,
  answer     TEXT      NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users (id)  ON DELETE CASCADE
) ENGINE = InnoDB;

-- 8. event_winners -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_winners (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  event_id    INT          NOT NULL,
  position    INT          NOT NULL,                         -- 1, 2, 3 ... (4+ = special mention)
  winner_name VARCHAR(150) NOT NULL,
  prize       VARCHAR(100) NULL,
  FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
  CHECK (position >= 1)
) ENGINE = InnoDB;

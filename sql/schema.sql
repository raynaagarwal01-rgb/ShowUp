-- ==============================================================================
-- ShowUp MySQL schema
--
-- Plain MySQL 8.0+ — no Supabase. Run it with the mysql client:
--
--   mysql -u root -p < sql/schema.sql
--
-- or through Node:  npm run db:init
--
-- The script is idempotent (CREATE ... IF NOT EXISTS), so it is safe to re-run.
-- All timestamps are stored as UTC DATETIME(3).
--
-- Access rules that Supabase enforced with row-level security now live in the
-- API layer (server/routes/*.js); the constraints below keep the data itself
-- consistent regardless of who talks to the database.
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS showup
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE showup;

-- 1. Profiles ----------------------------------------------------------------
-- One row per person. This table also holds the login credential, replacing
-- Supabase's auth.users. password_hash is NULL for accounts that were created
-- on someone's behalf (e.g. a teammate added by a team leader) and have not
-- been claimed yet — those cannot sign in until the owner sets a password via
-- "Forgot password".
CREATE TABLE IF NOT EXISTS profiles (
  id            VARCHAR(64)  NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NULL,
  name          VARCHAR(255) NOT NULL,
  role          ENUM('student', 'organizer', 'admin') NOT NULL DEFAULT 'student',
  state         VARCHAR(100) NULL,
  city          VARCHAR(100) NULL,
  college       VARCHAR(255) NULL,
  branch        VARCHAR(255) NULL,
  year          VARCHAR(50)  NULL,
  phone         VARCHAR(50)  NULL,
  reg_no        VARCHAR(50)  NULL,
  bio           TEXT         NULL,
  github        VARCHAR(255) NULL,
  linkedin      VARCHAR(255) NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_profiles_email (email)   -- case-insensitive under this collation
) ENGINE=InnoDB;

-- 2. Login sessions (replaces Supabase Auth's JWT sessions) ------------------
-- Only a SHA-256 of the bearer token is stored, never the token itself.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash CHAR(64)    NOT NULL,
  user_id    VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at DATETIME(3) NOT NULL,
  PRIMARY KEY (token_hash),
  KEY idx_sessions_user (user_id),
  KEY idx_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Password reset tokens (single-use, short-lived, hashed at rest) ---------
CREATE TABLE IF NOT EXISTS password_resets (
  token_hash CHAR(64)    NOT NULL,
  user_id    VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at DATETIME(3) NOT NULL,
  used_at    DATETIME(3) NULL,
  PRIMARY KEY (token_hash),
  KEY idx_password_resets_user (user_id),
  CONSTRAINT fk_password_resets_user FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Events ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id                    VARCHAR(64)  NOT NULL,
  club_id               VARCHAR(64)  NOT NULL,
  club_name             VARCHAR(255) NOT NULL,
  title                 VARCHAR(255) NOT NULL,
  tagline               VARCHAR(512) NOT NULL,
  description           TEXT         NOT NULL,
  rules                 JSON         NOT NULL,          -- array of strings (was text[])
  category              VARCHAR(50)  NOT NULL,
  scope                 ENUM('internal', 'external', 'both') NOT NULL,
  state                 VARCHAR(100) NOT NULL,
  city                  VARCHAR(100) NOT NULL,
  college               VARCHAR(255) NOT NULL,
  venue                 VARCHAR(512) NOT NULL,
  start_at              DATETIME(3)  NOT NULL,
  end_at                DATETIME(3)  NOT NULL,
  registration_deadline DATETIME(3)  NOT NULL,
  capacity              INT          NOT NULL,
  fee                   INT          NOT NULL DEFAULT 0,
  team_min              INT          NOT NULL DEFAULT 1,
  team_max              INT          NOT NULL DEFAULT 1,
  banner_hue            INT          NOT NULL DEFAULT 200,
  status                ENUM('draft', 'published') NOT NULL DEFAULT 'published',
  created_by            VARCHAR(64)  NOT NULL,
  created_at            DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_events_status_start (status, start_at),
  KEY idx_events_city (state, city),
  KEY idx_events_college (college),
  KEY idx_events_creator (created_by),
  CONSTRAINT fk_events_creator  FOREIGN KEY (created_by) REFERENCES profiles (id),
  CONSTRAINT chk_events_capacity CHECK (capacity > 0),
  CONSTRAINT chk_events_fee      CHECK (fee >= 0)
) ENGINE=InnoDB;

-- 5. Teams -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
  id           VARCHAR(64)  NOT NULL,
  event_id     VARCHAR(64)  NOT NULL,
  name         VARCHAR(255) NOT NULL,
  join_code    VARCHAR(16)  NOT NULL,
  project_idea TEXT         NULL,
  created_by   VARCHAR(64)  NOT NULL,                   -- the team leader
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_teams_event_code (event_id, join_code),
  CONSTRAINT fk_teams_event   FOREIGN KEY (event_id)   REFERENCES events (id)   ON DELETE CASCADE,
  CONSTRAINT fk_teams_creator FOREIGN KEY (created_by) REFERENCES profiles (id)
) ENGINE=InnoDB;

-- Team membership as a proper join table (was the uuid[] member_ids column).
CREATE TABLE IF NOT EXISTS team_members (
  team_id   VARCHAR(64) NOT NULL,
  user_id   VARCHAR(64) NOT NULL,
  joined_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (team_id, user_id),
  KEY idx_team_members_user (user_id),
  CONSTRAINT fk_team_members_team FOREIGN KEY (team_id) REFERENCES teams (id)    ON DELETE CASCADE,
  CONSTRAINT fk_team_members_user FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Registrations -----------------------------------------------------------
-- One registration per person per event (the app always replaced an earlier
-- one; this makes the database enforce it).
CREATE TABLE IF NOT EXISTS registrations (
  id            VARCHAR(64) NOT NULL,
  event_id      VARCHAR(64) NOT NULL,
  user_id       VARCHAR(64) NOT NULL,
  team_id       VARCHAR(64) NULL,
  status        ENUM('confirmed', 'waitlisted', 'cancelled') NOT NULL,
  checked_in_at DATETIME(3) NULL,
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_registrations_event_user (event_id, user_id),
  KEY idx_registrations_event (event_id, status),
  KEY idx_registrations_user (user_id),
  KEY idx_registrations_team (team_id),
  CONSTRAINT fk_registrations_event FOREIGN KEY (event_id) REFERENCES events (id)   ON DELETE CASCADE,
  CONSTRAINT fk_registrations_user  FOREIGN KEY (user_id)  REFERENCES profiles (id),
  CONSTRAINT fk_registrations_team  FOREIGN KEY (team_id)  REFERENCES teams (id)    ON DELETE SET NULL
) ENGINE=InnoDB;

-- 7. Announcements -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcements (
  id          VARCHAR(64)  NOT NULL,
  event_id    VARCHAR(64)  NOT NULL,
  title       VARCHAR(255) NOT NULL,
  content     TEXT         NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  is_urgent   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_announcements_event (event_id, created_at),
  CONSTRAINT fk_announcements_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Event Q&A ---------------------------------------------------------------
-- user_id is NULL for guest questions.
CREATE TABLE IF NOT EXISTS event_questions (
  id          VARCHAR(64)  NOT NULL,
  event_id    VARCHAR(64)  NOT NULL,
  user_id     VARCHAR(64)  NULL,
  user_name   VARCHAR(255) NOT NULL,
  question    TEXT         NOT NULL,
  answer      TEXT         NULL,
  answered_by VARCHAR(255) NULL,
  answered_at DATETIME(3)  NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_event_questions_event (event_id, created_at),
  CONSTRAINT fk_event_questions_event FOREIGN KEY (event_id) REFERENCES events (id)   ON DELETE CASCADE,
  CONSTRAINT fk_event_questions_user  FOREIGN KEY (user_id)  REFERENCES profiles (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 9. Winners -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_winners (
  id                       VARCHAR(64)  NOT NULL,
  event_id                 VARCHAR(64)  NOT NULL,
  position                 INT          NOT NULL DEFAULT 1,
  winner_title             VARCHAR(255) NOT NULL,
  team_or_participant_name VARCHAR(255) NOT NULL,
  college                  VARCHAR(255) NOT NULL DEFAULT 'VIT Vellore',
  prize_amount             VARCHAR(255) NOT NULL DEFAULT '',
  project_title            VARCHAR(255) NOT NULL DEFAULT '',
  project_link             VARCHAR(512) NOT NULL DEFAULT '',
  announced_by             VARCHAR(255) NOT NULL DEFAULT 'Event Organizing Committee',
  created_at               DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_event_winners_event (event_id, position),
  CONSTRAINT fk_event_winners_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. "Looking for teammates" listings ---------------------------------------
CREATE TABLE IF NOT EXISTS teammate_listings (
  id           VARCHAR(64)  NOT NULL,
  event_id     VARCHAR(64)  NOT NULL,
  user_id      VARCHAR(64)  NOT NULL,
  user_name    VARCHAR(255) NOT NULL,
  user_college VARCHAR(255) NOT NULL DEFAULT '',
  looking_for  VARCHAR(512) NOT NULL,
  message      TEXT         NOT NULL,
  contact      VARCHAR(255) NOT NULL DEFAULT '',
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_teammate_listings_event_user (event_id, user_id),
  CONSTRAINT fk_teammate_listings_event FOREIGN KEY (event_id) REFERENCES events (id)   ON DELETE CASCADE,
  CONSTRAINT fk_teammate_listings_user  FOREIGN KEY (user_id)  REFERENCES profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ShowUp's active MySQL schema: accounts, events, and individual registrations.
-- CREATE IF NOT EXISTS preserves existing data; this does not remove retired tables.

CREATE DATABASE IF NOT EXISTS showup CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE showup;

CREATE TABLE IF NOT EXISTS users (
  id                  INT AUTO_INCREMENT PRIMARY KEY,       -- primary key: one id per account
  name                VARCHAR(100) NOT NULL,
  email               VARCHAR(255) NOT NULL UNIQUE,         -- unique: one account per email
  password_hash       VARCHAR(255) NOT NULL,
  role                ENUM('student', 'organizer') NOT NULL DEFAULT 'student',
  college             VARCHAR(150) NULL,
  reg_no              VARCHAR(30) NULL,
  session_token_hash  CHAR(64) NULL,
  session_expires_at  DATETIME NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_session_token_hash (session_token_hash)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS events (
  id                    INT AUTO_INCREMENT PRIMARY KEY,     -- primary key: one id per event
  organizer_id          INT NOT NULL,
  title                 VARCHAR(200) NOT NULL,
  description           TEXT NOT NULL,
  category              VARCHAR(50) NOT NULL,
  venue                 VARCHAR(200) NOT NULL,
  event_date            DATETIME NOT NULL,
  registration_deadline DATETIME NOT NULL,
  capacity              INT NOT NULL,
  fee                   INT NOT NULL DEFAULT 0,
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_events_organizer FOREIGN KEY (organizer_id) REFERENCES users (id) ON DELETE CASCADE,
  CHECK (capacity > 0),
  CHECK (fee >= 0)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS registrations (
  id            INT AUTO_INCREMENT PRIMARY KEY,             -- primary key: one ticket per registration
  user_id       INT NOT NULL,
  event_id      INT NOT NULL,
  status        ENUM('confirmed', 'cancelled') NOT NULL DEFAULT 'confirmed',
  checked_in_at DATETIME NULL,
  registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_registrations_user_event UNIQUE (user_id, event_id), -- unique: no duplicate enrollment
  CONSTRAINT fk_registrations_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_registrations_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
) ENGINE = InnoDB;

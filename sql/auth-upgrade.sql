-- Add SQL-backed sessions to an existing users table without changing account data.
USE showup;

SET @has_token_hash = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'session_token_hash'
);
SET @sql = IF(@has_token_hash = 0,
  'ALTER TABLE users ADD COLUMN session_token_hash CHAR(64) NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_expiry = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'session_expires_at'
);
SET @sql = IF(@has_expiry = 0,
  'ALTER TABLE users ADD COLUMN session_expires_at DATETIME NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_token_index = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'uq_users_session_token_hash'
);
SET @sql = IF(@has_token_index = 0,
  'CREATE UNIQUE INDEX uq_users_session_token_hash ON users (session_token_hash)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

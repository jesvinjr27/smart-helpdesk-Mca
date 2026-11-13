-- Smart Help Desk Database Initialization Script
-- MySQL Community Edition 8.0+

CREATE DATABASE IF NOT EXISTS smart_helpdesk
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_helpdesk;

-- Grant privileges
GRANT ALL PRIVILEGES ON smart_helpdesk.* TO 'helpdesk_user'@'%';
FLUSH PRIVILEGES;

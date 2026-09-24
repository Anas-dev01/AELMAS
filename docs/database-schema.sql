-- Run this once against an existing aelmas_db database if the application
-- account is not allowed to alter tables automatically at server start.
ALTER TABLE users ADD COLUMN registrar_signature MEDIUMTEXT NULL;
ALTER TABLE leave_requests ADD COLUMN registrar_id INT NULL;

-- Optional (recommended) referential-integrity constraint:
-- ALTER TABLE leave_requests
--   ADD CONSTRAINT fk_leave_request_registrar
--   FOREIGN KEY (registrar_id) REFERENCES users(user_id);

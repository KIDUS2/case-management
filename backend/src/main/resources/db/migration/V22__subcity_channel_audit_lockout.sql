-- Notifications from sub-cities travel on their own channel, addressed to the administrator.
ALTER TABLE notification ADD COLUMN channel  VARCHAR(10) NOT NULL DEFAULT 'GENERAL';
ALTER TABLE notification ADD COLUMN sub_city VARCHAR(80);
UPDATE notification SET channel = 'SUBCITY' WHERE type IN ('SUBMITTED', 'SUBCITY_REPLY');
CREATE INDEX ix_notification_channel ON notification (user_id, channel, read_at);

-- Who did what, and who looked at what.
CREATE TABLE audit_log (
    id         BIGSERIAL PRIMARY KEY,
    at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    username   VARCHAR(100),
    action     VARCHAR(30)  NOT NULL,
    entity     VARCHAR(30),
    entity_id  VARCHAR(40),
    detail     VARCHAR(500),
    ip         VARCHAR(60)
);
CREATE INDEX ix_audit_at ON audit_log (at DESC);
CREATE INDEX ix_audit_user ON audit_log (username, at DESC);

-- Too many wrong passwords lock the account for a while.
ALTER TABLE app_user ADD COLUMN failed_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE app_user ADD COLUMN locked_until TIMESTAMPTZ;

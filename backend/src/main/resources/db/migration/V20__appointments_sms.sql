-- Simple key/value settings the administrator can change (appointment spots per day, SMS language ...).
CREATE TABLE app_setting (
    setting_key   VARCHAR(60) PRIMARY KEY,
    setting_value VARCHAR(500) NOT NULL
);
INSERT INTO app_setting (setting_key, setting_value) VALUES
    ('appointment.capacity', '30'),
    ('appointment.open_days', 'MON,TUE,WED,THU,FRI'),
    ('sms.language', 'BOTH');

-- One appointment = one numbered spot on one day for one case.
CREATE TABLE appointment (
    id         BIGSERIAL PRIMARY KEY,
    case_id    BIGINT       NOT NULL REFERENCES church_case (id) ON DELETE CASCADE,
    appt_date  DATE         NOT NULL,
    spot_no    INT          NOT NULL,
    status     VARCHAR(12)  NOT NULL DEFAULT 'BOOKED',
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX ix_appointment_case ON appointment (case_id);
CREATE INDEX ix_appointment_day  ON appointment (appt_date, status);
-- a spot number is used once per day while it is still held
CREATE UNIQUE INDEX ux_appointment_spot ON appointment (appt_date, spot_no) WHERE status <> 'CANCELLED';

-- Every text message we tried to send.
CREATE TABLE sms_message (
    id         BIGSERIAL PRIMARY KEY,
    case_id    BIGINT REFERENCES church_case (id) ON DELETE SET NULL,
    phone      VARCHAR(40)   NOT NULL,
    body       VARCHAR(1000) NOT NULL,
    status     VARCHAR(12)   NOT NULL,
    error      VARCHAR(500),
    created_at TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX ix_sms_case ON sms_message (case_id);

-- Employee ID is asked for employees; everyone else gives their Sebeka Gubaye number.
ALTER TABLE person ADD COLUMN sebeka_gubaye_no VARCHAR(40);

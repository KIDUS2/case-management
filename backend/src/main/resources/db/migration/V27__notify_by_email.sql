-- Case-number messages can now go out by email as well as by text message.
ALTER TABLE sms_message ADD COLUMN channel VARCHAR(8) NOT NULL DEFAULT 'SMS';
-- the "phone" column now holds a phone number or an email address
ALTER TABLE sms_message ALTER COLUMN phone TYPE VARCHAR(160);
-- who gets the message: SMS, EMAIL or BOTH (what the person has on file is used)
INSERT INTO app_setting (setting_key, setting_value) VALUES ('notify.channel', 'SMS') ON CONFLICT DO NOTHING;

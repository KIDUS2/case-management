-- How heavy (time-consuming) an issue is. Heavier issues are served first within a department; the administrator
-- sets a default weight per issue type in Settings (stored as weight.<CODE>) and can change it on a single issue.
ALTER TABLE case_issue ADD COLUMN weight INT NOT NULL DEFAULT 1;

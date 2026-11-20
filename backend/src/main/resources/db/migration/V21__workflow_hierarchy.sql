-- Case kind: a normal issue, or a charity request (help for a person, not a problem to solve).
ALTER TABLE church_case ADD COLUMN kind VARCHAR(10) NOT NULL DEFAULT 'ISSUE';
-- A case the sub-city already solved itself and shared with the diocese.
ALTER TABLE church_case ADD COLUMN sub_city_solved BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX ix_case_kind ON church_case (kind);

INSERT INTO option_item (list_key, code, label, label_am, icon, system, sort_no)
VALUES ('ISSUE_TYPE', 'CHARITY', 'Charity request', 'የበጎ አድራጎት ጥያቄ', '🤝', TRUE, 6)
ON CONFLICT (list_key, code) DO NOTHING;

-- Set aside: a long issue waits without blocking the simple ones behind it.
ALTER TABLE case_issue ADD COLUMN held        BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE case_issue ADD COLUMN hold_reason VARCHAR(500);
ALTER TABLE case_issue ADD COLUMN held_at     TIMESTAMPTZ;
-- Who is handling it: 0 department, 1 Sera Askiyajie, 2 Papas (final decision).
ALTER TABLE case_issue ADD COLUMN handler_level INT NOT NULL DEFAULT 0;

-- A committee looks into a case and reports back.
CREATE TABLE investigation (
    id           BIGSERIAL PRIMARY KEY,
    case_id      BIGINT NOT NULL REFERENCES church_case (id) ON DELETE CASCADE,
    issue_id     BIGINT,
    instruction  TEXT NOT NULL,
    team         VARCHAR(500),
    assigned_to  VARCHAR(100),
    status       VARCHAR(12) NOT NULL DEFAULT 'OPEN',
    requested_by VARCHAR(100) NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    report       TEXT,
    reported_by  VARCHAR(100),
    reported_at  TIMESTAMPTZ
);
CREATE INDEX ix_investigation_case ON investigation (case_id);
CREATE INDEX ix_investigation_assignee ON investigation (assigned_to, status);

-- A case (or one issue) is sent to a sub-city, which sends its solution back.
CREATE TABLE subcity_referral (
    id          BIGSERIAL PRIMARY KEY,
    case_id     BIGINT NOT NULL REFERENCES church_case (id) ON DELETE CASCADE,
    issue_id    BIGINT,
    sub_city    VARCHAR(80) NOT NULL,
    instruction TEXT NOT NULL,
    status      VARCHAR(12) NOT NULL DEFAULT 'SENT',
    sent_by     VARCHAR(100) NOT NULL,
    sent_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    solution    TEXT,
    replied_by  VARCHAR(100),
    replied_at  TIMESTAMPTZ
);
CREATE INDEX ix_subref_case ON subcity_referral (case_id);
CREATE INDEX ix_subref_sub  ON subcity_referral (sub_city, status);

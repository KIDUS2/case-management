CREATE TABLE church_facility (
    id          BIGSERIAL PRIMARY KEY,
    church_id   BIGINT       NOT NULL REFERENCES church(id) ON DELETE CASCADE,
    kind        VARCHAR(30)  NOT NULL,
    name        VARCHAR(120),
    capacity    INTEGER,
    facility_condition VARCHAR(20),
    notes       VARCHAR(500),
    created_by  VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_church_facility_church ON church_facility(church_id);

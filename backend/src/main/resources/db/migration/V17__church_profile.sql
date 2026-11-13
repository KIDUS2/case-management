-- A church's own details, its place on the map, and its documents (carta = land title, and others).
ALTER TABLE church ADD COLUMN address VARCHAR(255);
ALTER TABLE church ADD COLUMN phone VARCHAR(40);
ALTER TABLE church ADD COLUMN email VARCHAR(120);
ALTER TABLE church ADD COLUMN patron_saint VARCHAR(120);
ALTER TABLE church ADD COLUMN established_year INTEGER;
ALTER TABLE church ADD COLUMN land_area VARCHAR(60);
ALTER TABLE church ADD COLUMN carta_number VARCHAR(80);
ALTER TABLE church ADD COLUMN latitude DOUBLE PRECISION;
ALTER TABLE church ADD COLUMN longitude DOUBLE PRECISION;
ALTER TABLE church ADD COLUMN notes TEXT;

CREATE TABLE church_file (
    id            BIGSERIAL PRIMARY KEY,
    church_id     BIGINT NOT NULL REFERENCES church(id) ON DELETE CASCADE,
    kind          VARCHAR(20) NOT NULL DEFAULT 'OTHER',
    title         VARCHAR(160) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name   VARCHAR(255) NOT NULL,
    content_type  VARCHAR(120),
    size_bytes    BIGINT NOT NULL,
    uploaded_by   VARCHAR(80) NOT NULL,
    uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_church_file_church ON church_file(church_id);

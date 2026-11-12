-- A person at the desk can say "this case is related to that case" even when no person is shared.
CREATE TABLE case_link (
    id             BIGSERIAL PRIMARY KEY,
    case_id        BIGINT      NOT NULL REFERENCES church_case(id) ON DELETE CASCADE,
    linked_case_id BIGINT      NOT NULL REFERENCES church_case(id) ON DELETE CASCADE,
    linked_by      VARCHAR(80) NOT NULL,
    linked_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_case_link UNIQUE (case_id, linked_case_id),
    CONSTRAINT ck_case_link_diff CHECK (case_id <> linked_case_id)
);
CREATE INDEX ix_case_link_linked ON case_link(linked_case_id);

-- A case made on a device that was offline carries a reference, so sending it twice never creates two cases.
ALTER TABLE church_case ADD COLUMN client_ref VARCHAR(64);
CREATE UNIQUE INDEX uq_church_case_client_ref ON church_case (client_ref) WHERE client_ref IS NOT NULL;

ALTER TABLE schema_snapshots DROP CONSTRAINT IF EXISTS schema_snapshots_pkey;

ALTER TABLE schema_snapshots
    ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

UPDATE schema_snapshots
SET id = gen_random_uuid()
WHERE id IS NULL;

ALTER TABLE schema_snapshots
    ALTER COLUMN id SET NOT NULL;

ALTER TABLE schema_snapshots
    ADD CONSTRAINT schema_snapshots_pkey PRIMARY KEY (id);

ALTER TABLE schema_snapshots
    ALTER COLUMN fingerprint SET NOT NULL;

ALTER TABLE schema_snapshots
    ADD CONSTRAINT uq_schema_snapshots_endpoint_fingerprint UNIQUE (endpoint_id, fingerprint);

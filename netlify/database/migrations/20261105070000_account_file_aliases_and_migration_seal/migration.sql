-- A public legacy file may be referenced by several accounts. Each receives
-- its own private copy and alias, with independent access and deletion.
ALTER TABLE wellnest_file_aliases ADD COLUMN owner_id text REFERENCES wellnest_users(id) ON DELETE CASCADE;
UPDATE wellnest_file_aliases a SET owner_id=f.owner_id FROM wellnest_files f WHERE f.id=a.file_id;
ALTER TABLE wellnest_file_aliases ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE wellnest_file_aliases DROP CONSTRAINT wellnest_file_aliases_pkey;
ALTER TABLE wellnest_file_aliases ADD PRIMARY KEY(owner_id,legacy_uri);
DROP POLICY aliases_isolation ON wellnest_file_aliases;
CREATE POLICY aliases_isolation ON wellnest_file_aliases USING (
 current_setting('wellnest.service',true)='true' OR owner_id=current_setting('wellnest.user_id',true)
) WITH CHECK (
 current_setting('wellnest.service',true)='true' OR
 (owner_id=current_setting('wellnest.user_id',true) AND EXISTS (
  SELECT 1 FROM wellnest_files f WHERE f.id=file_id AND f.owner_id=wellnest_file_aliases.owner_id
 ))
);
ALTER TABLE wellnest_files ADD COLUMN sha256 text CHECK (sha256 IS NULL OR sha256 ~ '^[0-9a-f]{64}$');
CREATE TABLE wellnest_migration_runs (
 id text PRIMARY KEY,
 expires_at timestamptz NOT NULL,
 sealed_at timestamptz,
 data jsonb NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE wellnest_migration_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellnest_migration_runs FORCE ROW LEVEL SECURITY;
CREATE POLICY migration_runs_service_only ON wellnest_migration_runs USING (
 current_setting('wellnest.service',true)='true'
) WITH CHECK (current_setting('wellnest.service',true)='true');
GRANT SELECT,INSERT,UPDATE,DELETE ON wellnest_migration_runs TO wellnest_runtime;

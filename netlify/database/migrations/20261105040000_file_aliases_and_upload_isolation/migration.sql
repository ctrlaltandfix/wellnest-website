CREATE TABLE wellnest_file_aliases (
 legacy_uri text PRIMARY KEY,
 file_id text NOT NULL REFERENCES wellnest_files(id) ON DELETE CASCADE
);
ALTER TABLE wellnest_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellnest_uploads FORCE ROW LEVEL SECURITY;
CREATE POLICY uploads_isolation ON wellnest_uploads USING (
 current_setting('wellnest.service',true)='true' OR owner_id=current_setting('wellnest.user_id',true)
) WITH CHECK (
 current_setting('wellnest.service',true)='true' OR owner_id=current_setting('wellnest.user_id',true)
);
ALTER TABLE wellnest_migration_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellnest_migration_batches FORCE ROW LEVEL SECURITY;
CREATE POLICY migration_isolation ON wellnest_migration_batches USING (
 current_setting('wellnest.service',true)='true'
) WITH CHECK (current_setting('wellnest.service',true)='true');

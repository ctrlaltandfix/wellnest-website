ALTER TABLE wellnest_file_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellnest_file_aliases FORCE ROW LEVEL SECURITY;
CREATE POLICY aliases_isolation ON wellnest_file_aliases USING (
 current_setting('wellnest.service',true)='true' OR EXISTS (
  SELECT 1 FROM wellnest_files f
  WHERE f.id=file_id AND f.owner_id=current_setting('wellnest.user_id',true)
 )
) WITH CHECK (
 current_setting('wellnest.service',true)='true' OR EXISTS (
  SELECT 1 FROM wellnest_files f
  WHERE f.id=file_id AND f.owner_id=current_setting('wellnest.user_id',true)
 )
);

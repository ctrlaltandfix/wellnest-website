CREATE TABLE wellnest_google_calendar (
  owner_id text PRIMARY KEY REFERENCES wellnest_users(id) ON DELETE CASCADE,
  credentials text NOT NULL,
  calendar_id text,
  calendar_name text,
  calendar_timezone text,
  sync_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at timestamptz
);
ALTER TABLE wellnest_google_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellnest_google_calendar FORCE ROW LEVEL SECURITY;
CREATE POLICY google_calendar_isolation ON wellnest_google_calendar
 USING (owner_id = current_setting('wellnest.user_id',true))
 WITH CHECK (owner_id = current_setting('wellnest.user_id',true));
GRANT SELECT, INSERT, UPDATE, DELETE ON wellnest_google_calendar TO wellnest_runtime;

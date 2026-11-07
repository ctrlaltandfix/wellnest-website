CREATE TABLE wellnest_users (
  id text PRIMARY KEY,
  auth_id text UNIQUE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin','tester')),
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now(),
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX wellnest_users_email ON wellnest_users (lower(email));
CREATE TABLE wellnest_records (
  entity text NOT NULL,
  id text NOT NULL,
  owner_id text REFERENCES wellnest_users(id) ON DELETE CASCADE,
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now(),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (entity,id)
);
CREATE INDEX wellnest_records_owner ON wellnest_records(entity,owner_id,updated_date DESC);
CREATE INDEX wellnest_records_data ON wellnest_records USING gin(data jsonb_path_ops);
CREATE TABLE wellnest_files (
  id text PRIMARY KEY,
  owner_id text NOT NULL REFERENCES wellnest_users(id) ON DELETE CASCADE,
  blob_key text NOT NULL UNIQUE,
  name text NOT NULL,
  content_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes>=0),
  created_date timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE wellnest_uploads (
  id text PRIMARY KEY,
  owner_id text NOT NULL REFERENCES wellnest_users(id) ON DELETE CASCADE,
  name text NOT NULL,
  content_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes BETWEEN 1 AND 52428800),
  chunk_count integer NOT NULL CHECK (chunk_count BETWEEN 1 AND 32),
  received integer[] NOT NULL DEFAULT '{}',
  created_date timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE wellnest_rate_limits (
  bucket text NOT NULL,
  identity_hash text NOT NULL,
  window_start bigint NOT NULL,
  hits integer NOT NULL DEFAULT 1,
  PRIMARY KEY(bucket,identity_hash,window_start)
);
CREATE TABLE wellnest_events (
  event_id text PRIMARY KEY,
  kind text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE wellnest_migration_batches (
  id text PRIMARY KEY,
  entity text NOT NULL,
  records jsonb NOT NULL,
  imported_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- The database is never exposed to browsers. Runtime connections always set
-- a verified actor on their transaction; service access exists only in code.
ALTER TABLE wellnest_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellnest_users FORCE ROW LEVEL SECURITY;
CREATE POLICY users_isolation ON wellnest_users USING (
  current_setting('wellnest.service',true)='true' OR id=current_setting('wellnest.user_id',true)
) WITH CHECK (
  current_setting('wellnest.service',true)='true' OR id=current_setting('wellnest.user_id',true)
);
ALTER TABLE wellnest_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellnest_records FORCE ROW LEVEL SECURITY;
CREATE POLICY records_isolation ON wellnest_records USING (
  current_setting('wellnest.service',true)='true' OR owner_id=current_setting('wellnest.user_id',true)
) WITH CHECK (
  current_setting('wellnest.service',true)='true' OR owner_id=current_setting('wellnest.user_id',true)
);
ALTER TABLE wellnest_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellnest_files FORCE ROW LEVEL SECURITY;
CREATE POLICY files_isolation ON wellnest_files USING (
  current_setting('wellnest.service',true)='true' OR owner_id=current_setting('wellnest.user_id',true)
) WITH CHECK (
  current_setting('wellnest.service',true)='true' OR owner_id=current_setting('wellnest.user_id',true)
);

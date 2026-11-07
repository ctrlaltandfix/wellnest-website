-- Managed connection roles may bypass RLS. Application transactions explicitly
-- assume this restricted role before executing any account or file queries.
DO $wellnest$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='wellnest_runtime') THEN
  CREATE ROLE wellnest_runtime NOLOGIN NOINHERIT NOSUPERUSER
   NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
 END IF;
END
$wellnest$;
GRANT USAGE ON SCHEMA public TO wellnest_runtime;
GRANT SELECT,INSERT,UPDATE,DELETE ON
 wellnest_users,wellnest_records,wellnest_files,wellnest_uploads,
 wellnest_file_aliases,wellnest_rate_limits,wellnest_events,
 wellnest_migration_batches TO wellnest_runtime;
GRANT wellnest_runtime TO CURRENT_USER;

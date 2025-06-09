-- init/00-init-schemas.sql

CREATE EXTENSION IF NOT EXISTS vector;

-- Separate schema for core agent memory
CREATE SCHEMA IF NOT EXISTS agent_memory;

-- Separate schema for semantic vector storage
CREATE SCHEMA IF NOT EXISTS vector;
-- Create the agent role if it doesn't exist
DO $$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles WHERE rolname = 'agent'
   ) THEN
      CREATE ROLE agent LOGIN;
   END IF;
END
$$;

GRANT USAGE ON SCHEMA agent_memory TO agent;
GRANT USAGE ON SCHEMA vector TO agent;

-- Ensure agent can read and write to *future* tables and sequences in the schemas
ALTER DEFAULT PRIVILEGES IN SCHEMA agent_memory
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO agent;
ALTER DEFAULT PRIVILEGES IN SCHEMA vector
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO agent;

ALTER DEFAULT PRIVILEGES IN SCHEMA agent_memory
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO agent;
ALTER DEFAULT PRIVILEGES IN SCHEMA vector
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO agent;

DO $$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles WHERE rolname = 'admin'
   ) THEN
      CREATE ROLE admin LOGIN;
   END IF;
END
$$;

-- Ensure agent can read and write to *future* tables and sequences in the schemas
ALTER DEFAULT PRIVILEGES IN SCHEMA agent_memory
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA vector
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA agent_memory
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA vector
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO admin;


GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA agent_memory TO admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA vector TO admin;

-- Grant usage and modification on existing sequences in agent_memory
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA agent_memory TO admin;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA vector TO admin;

GRANT ALL ON SCHEMA agent_memory TO admin;
GRANT ALL ON SCHEMA vector TO admin;


-- Optional: Set default schema search path
ALTER ROLE agent SET search_path TO agent_memory, vector, public;
ALTER ROLE admin SET search_path TO agent_memory, vector, public;


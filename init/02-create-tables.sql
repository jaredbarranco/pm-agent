-- Ensure pgvector extension is available
CREATE EXTENSION IF NOT EXISTS vector;

-- Create schema
CREATE SCHEMA IF NOT EXISTS agent_memory;

-- agent_memory.tasks
CREATE TABLE IF NOT EXISTS agent_memory.tasks (
    id UUID PRIMARY KEY,
    description TEXT NOT NULL,
    owner TEXT,
    context TEXT,
    status TEXT CHECK (status IN ('open', 'complete', 'expired')) DEFAULT 'open',
    due_date DATE,
    created_at TIMESTAMP DEFAULT now(),
    completed_at TIMESTAMP,
    linked_jira_key TEXT
);

-- agent_memory.people
CREATE TABLE IF NOT EXISTS agent_memory.people (
    name TEXT PRIMARY KEY,
    email TEXT,
    jira_username TEXT,
    aliases TEXT[]
);

-- agent_memory.action_log
CREATE TABLE IF NOT EXISTS agent_memory.action_log (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT now(),
    action_type TEXT NOT NULL,
    description TEXT,
    source TEXT,
    status TEXT CHECK (status IN ('pending', 'success', 'failed')),
    error TEXT
);

-- agent_memory.meeting_contexts
CREATE TABLE IF NOT EXISTS agent_memory.meeting_contexts (
    id UUID PRIMARY KEY,
    source TEXT,
    content TEXT,
    parsed_at TIMESTAMP DEFAULT now(),
    parsed_actions JSONB
);

-- agent_memory.memory_embeddings
CREATE TABLE IF NOT EXISTS agent_memory.memory_embeddings (
    id UUID PRIMARY KEY,
    content TEXT,
    embedding vector(1536),
    metadata JSONB,
    source TEXT
);


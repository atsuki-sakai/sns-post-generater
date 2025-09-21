-- Migration: Create posts table for storing SNS post data
-- Created: 2025-01-09

CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    theme TEXT NOT NULL,
    brand_voice TEXT NOT NULL,
    product TEXT,
    image_prompt TEXT,
    target_persona TEXT,
    user_id TEXT,
    content TEXT,
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);

-- Index for querying by status
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);

-- Index for querying by creation date
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
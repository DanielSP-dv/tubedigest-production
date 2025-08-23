-- Migration: Add SearchAPI cache table
-- This table stores cached video transcripts and summaries from SearchAPI
-- to reduce API calls and save tokens

CREATE TABLE IF NOT EXISTS search_api_cache (
    id SERIAL PRIMARY KEY,
    video_id VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    transcript TEXT,
    summary TEXT,
    duration VARCHAR(20),
    published_at TIMESTAMP,
    channel_title VARCHAR(200),
    channel_id VARCHAR(50),
    search_query VARCHAR(500),
    api_response_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Index for fast lookups by video ID
CREATE INDEX IF NOT EXISTS idx_search_api_cache_video_id ON search_api_cache(video_id);

-- Index for querying by expiration
CREATE INDEX IF NOT EXISTS idx_search_api_cache_expires_at ON search_api_cache(expires_at);

-- Index for active records
CREATE INDEX IF NOT EXISTS idx_search_api_cache_active ON search_api_cache(is_active);

-- Add comment to table
COMMENT ON TABLE search_api_cache IS 'Cache for SearchAPI video transcripts and summaries to reduce API calls';

-- Add comments to columns
COMMENT ON COLUMN search_api_cache.video_id IS 'YouTube video ID (unique identifier)';
COMMENT ON COLUMN search_api_cache.transcript IS 'Cached video transcript from SearchAPI';
COMMENT ON COLUMN search_api_cache.summary IS 'Cached video summary from SearchAPI';
COMMENT ON COLUMN search_api_cache.expires_at IS 'When this cache entry expires (for automatic cleanup)';
COMMENT ON COLUMN search_api_cache.api_response_time_ms IS 'Response time from SearchAPI for monitoring';
COMMENT ON COLUMN search_api_cache.search_query IS 'Original search query that led to this result';

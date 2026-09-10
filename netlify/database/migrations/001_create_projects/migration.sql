CREATE TABLE IF NOT EXISTS projects (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  youtube_url TEXT,
  image_url TEXT,
  client TEXT,
  year INTEGER,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS projects_featured_created_at_idx
  ON projects (featured DESC, created_at DESC);

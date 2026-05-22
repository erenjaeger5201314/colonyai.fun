ALTER TABLE deployment_versions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

UPDATE deployment_versions
SET updated_at = COALESCE(updated_at, created_at);

CREATE INDEX IF NOT EXISTS deployment_versions_updated_at_idx
ON deployment_versions (updated_at DESC);

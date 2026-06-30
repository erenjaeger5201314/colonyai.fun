-- Drop the deployment-level like RPCs. They predate version-level likes and are
-- no longer referenced by the app, which now calls
-- increment_deployment_version_like_count / decrement_deployment_version_like_count
-- (those keep deployments.like_count in sync via sync_deployment_like_count).
DROP FUNCTION IF EXISTS increment_deployment_like_count(UUID);
DROP FUNCTION IF EXISTS decrement_deployment_like_count(UUID);

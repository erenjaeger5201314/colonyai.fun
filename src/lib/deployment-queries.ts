import { DeploymentVersionRow, supabase } from '@/lib/db';

/**
 * Fire-and-forget view-count bump. Never blocks the page response; logs on failure.
 * Shared by the /s/[code] and /s/[code]/v/[version] serve routes.
 */
export function incrementViewCount(deploymentId: string) {
  void supabase
    .rpc('increment_deployment_view_count', { target_id: deploymentId })
    .then(({ error }) => {
      if (error) {
        console.error('Increment view count error:', error);
      }
    });
}

export function fetchDeploymentByCode(code: string) {
  return supabase.from('deployments').select('*').eq('code', code).maybeSingle();
}

export function fetchDeploymentVersion(deploymentId: string, version: string | number) {
  const versionNumber = Number(version);
  const query = supabase
    .from('deployment_versions')
    .select('*')
    .eq('deployment_id', deploymentId);

  return (Number.isInteger(versionNumber) && versionNumber > 0
    ? query.eq('version_number', versionNumber)
    : query.eq('id', String(version))
  ).maybeSingle();
}

export async function fetchDeploymentVersions(deploymentId: string) {
  const { data, error } = await supabase
    .from('deployment_versions')
    .select('*')
    .eq('deployment_id', deploymentId)
    .order('version_number', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as DeploymentVersionRow[];
}

export async function getNextVersionNumber(deploymentId: string) {
  const { data, error } = await supabase
    .from('deployment_versions')
    .select('version_number')
    .eq('deployment_id', deploymentId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Number(data?.version_number ?? 0) + 1;
}

type AppendVersionParams = {
  deploymentId: string;
  versionNumber: number;
  title: string;
  description: string;
  filename: string;
  filePath: string;
  fileSize: number;
  updatedAt?: string;
};

type AppendVersionResult = {
  version: DeploymentVersionRow | null;
  // Which step failed, so callers can map their own error codes/messages.
  stage: 'version_insert' | 'pointer_update' | null;
  error: { message?: string } | null;
};

/**
 * Insert a new deployment version and point the deployment at it.
 * Shared by POST /api/deploy (append to existing) and PATCH /api/deploy/content,
 * which previously duplicated this two-step write.
 */
export async function appendVersionAndPromote(
  params: AppendVersionParams,
): Promise<AppendVersionResult> {
  const { deploymentId, versionNumber, title, description, filename, filePath, fileSize } = params;
  const updatedAt = params.updatedAt ?? new Date().toISOString();

  const { data: version, error: versionError } = await supabase
    .from('deployment_versions')
    .insert({
      deployment_id: deploymentId,
      version_number: versionNumber,
      title,
      description,
      filename,
      file_path: filePath,
      file_size: fileSize,
    })
    .select()
    .single();

  if (versionError || !version) {
    return { version: null, stage: 'version_insert', error: versionError };
  }

  const { error: updateError } = await supabase
    .from('deployments')
    .update({
      current_version_id: version.id,
      title,
      description,
      filename,
      file_path: filePath,
      file_size: fileSize,
      updated_at: updatedAt,
    })
    .eq('id', deploymentId);

  if (updateError) {
    return { version: version as DeploymentVersionRow, stage: 'pointer_update', error: updateError };
  }

  return { version: version as DeploymentVersionRow, stage: null, error: null };
}

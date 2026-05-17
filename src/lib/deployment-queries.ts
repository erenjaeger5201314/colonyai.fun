import { DeploymentVersionRow, supabase } from '@/lib/db';

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

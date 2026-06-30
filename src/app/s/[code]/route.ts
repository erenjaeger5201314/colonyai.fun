import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { htmlResponse } from '@/lib/api-response';
import { downloadDeploymentHtml, getStoragePathFromFilePath } from '@/lib/storage';
import { DeploymentVersionRow } from '@/lib/db';
import { selectPrimaryVersion } from '@/lib/version-selection';
import { incrementViewCount } from '@/lib/deployment-queries';
import { injectPreviewShim } from '@/lib/preview';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const isPreview = request.nextUrl.searchParams.get('preview') === '1';
    
    // For preview mode (admin embed), allow inactive deployments too
    const query = supabase
      .from('deployments')
      .select('id, file_path, status, current_version_id, primary_version_strategy')
      .eq('code', code);
    
    if (!isPreview) {
      query.eq('status', 'active');
    }
    
    const { data: deployment, error } = await query.single();

    if (error || !deployment) {
      return new NextResponse('Deployment not found or inactive', { status: 404 });
    }

    // Skip view count increment for embed/preview requests
    if (!isPreview) {
      incrementViewCount(deployment.id);
    }

    const { data: versions, error: versionsError } = await supabase
      .from('deployment_versions')
      .select('id, version_number, file_path, like_count, status')
      .eq('deployment_id', deployment.id)
      .order('version_number', { ascending: false });

    if (versionsError) {
      console.error('Fetch versions error:', versionsError);
    }

    const primaryVersion = selectPrimaryVersion(
      (versions || []) as DeploymentVersionRow[],
      deployment.current_version_id,
      deployment.primary_version_strategy || 'likes',
    );
    const storagePath = getStoragePathFromFilePath(primaryVersion?.file_path || deployment.file_path, code);
    const { content, error: downloadError } = await downloadDeploymentHtml(storagePath);

    if (downloadError || content == null) {
      console.error('Download error:', downloadError);
      return new NextResponse('File content not found', { status: 404 });
    }

    return htmlResponse(isPreview ? injectPreviewShim(content) : content, isPreview);

  } catch (error: unknown) {
    console.error('Serve error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

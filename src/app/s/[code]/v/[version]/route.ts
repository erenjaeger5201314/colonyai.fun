import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { htmlResponse } from '@/lib/api-response';
import { downloadDeploymentHtml, getStoragePathFromFilePath } from '@/lib/storage';
import { incrementViewCount } from '@/lib/deployment-queries';
import { injectPreviewShim } from '@/lib/preview';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string; version: string }> }
) {
  try {
    const { code, version } = await params;
    const isPreview = request.nextUrl.searchParams.get('preview') === '1';
    const versionNumber = Number(version);

    if (!Number.isInteger(versionNumber) || versionNumber <= 0) {
      return new NextResponse('Invalid version', { status: 400 });
    }

    const query = supabase
      .from('deployments')
      .select('id, status')
      .eq('code', code);

    if (!isPreview) {
      query.eq('status', 'active');
    }

    const { data: deployment, error: deploymentError } = await query.single();

    if (deploymentError || !deployment) {
      return new NextResponse('Deployment not found or inactive', { status: 404 });
    }

    const { data: selectedVersion, error: versionError } = await supabase
      .from('deployment_versions')
      .select('file_path, status')
      .eq('deployment_id', deployment.id)
      .eq('version_number', versionNumber)
      .maybeSingle();

    if (versionError || !selectedVersion || (!isPreview && selectedVersion.status === 'inactive')) {
      return new NextResponse('Deployment version not found', { status: 404 });
    }

    if (!isPreview) {
      incrementViewCount(deployment.id);
    }

    const storagePath = getStoragePathFromFilePath(selectedVersion.file_path, code);
    const { content, error: downloadError } = await downloadDeploymentHtml(storagePath);

    if (downloadError || content == null) {
      console.error('Download error:', downloadError);
      return new NextResponse('File content not found', { status: 404 });
    }

    return htmlResponse(isPreview ? injectPreviewShim(content) : content, isPreview);
  } catch (error: unknown) {
    console.error('Serve version error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

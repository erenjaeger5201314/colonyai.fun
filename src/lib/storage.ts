import { StorageError } from '@supabase/storage-js';
import { supabase } from '@/lib/db';

/**
 * Download a stored HTML file and return its text.
 * Shared by the serve routes and the content API, which each previously
 * inlined the same download + `.text()` dance.
 */
export async function downloadDeploymentHtml(storagePath: string) {
  const { data: fileData, error } = await supabase.storage
    .from('deployments')
    .download(storagePath);

  if (error || !fileData) {
    return { content: null, error: error?.message || 'File not found' };
  }

  return { content: await fileData.text(), error: null };
}

export function getStoragePathFromFilePath(filePath: unknown, fallbackCode: string) {
  const fallback = `html/${fallbackCode}.html`;
  if (typeof filePath !== 'string' || !filePath.trim()) {
    return fallback;
  }

  try {
    const parsed = new URL(filePath);
    const marker = '/deployments/';
    const index = parsed.pathname.indexOf(marker);
    if (index === -1) {
      return fallback;
    }

    const resolvedPath = parsed.pathname.slice(index + marker.length);
    return resolvedPath || fallback;
  } catch {
    return fallback;
  }
}

export function createVersionedHtmlPath(code: string, versionNumber: number, now = Date.now()) {
  return `html/${code}/v${versionNumber}-${now}.html`;
}

type StorageItem = {
  name: string;
};

type StorageListResult = {
  data: StorageItem[] | null;
  error: StorageError | null;
};

type StorageBucketLike = {
  list: (
    path?: string,
    options?: { limit?: number; offset?: number; search?: string }
  ) => Promise<StorageListResult>;
};

export async function listHtmlPathsByCode(bucket: StorageBucketLike, code: string) {
  const limit = 100;
  let offset = 0;
  const htmlPaths: string[] = [];

  while (true) {
    const { data, error } = await bucket.list('html', {
      limit,
      offset,
      search: code,
    });

    if (error) {
      throw new Error(error.message);
    }

    const batch = (data || [])
      .filter((item) => item.name.startsWith(`${code}`))
      .map((item) => `html/${item.name}`);

    htmlPaths.push(...batch);

    if (!data || data.length < limit) {
      break;
    }

    offset += limit;
  }

  return htmlPaths;
}

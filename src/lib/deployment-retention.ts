export function getIterationCount(versionCount: number | null | undefined) {
  return Math.max(Number(versionCount ?? 1) - 1, 0);
}

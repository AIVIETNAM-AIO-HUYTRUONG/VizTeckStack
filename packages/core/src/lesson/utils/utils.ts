export function parseBlocks(json: string): unknown[] | undefined {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as unknown[];
  } catch {
    // Invalid JSON
  }
  return undefined;
}

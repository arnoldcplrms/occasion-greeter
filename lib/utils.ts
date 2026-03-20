export function extractDriveFileId(url: string): string {
  const patterns = [
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return '';
}

export function normalizeEmailBase(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeSurnameBase(lastName: string): string {
  return lastName
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '_');
}

export function normalizeManifestSourceUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  const driveFileId = extractDriveFileId(trimmed);
  if (driveFileId) {
    return `https://drive.google.com/uc?export=download&id=${driveFileId}`;
  }

  return trimmed;
}

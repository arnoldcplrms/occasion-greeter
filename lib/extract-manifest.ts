import { OccasionManifest } from './drive-photo-service';
import { normalizeManifestSourceUrl } from './utils';

export async function getManifest(): Promise<OccasionManifest> {
  const url = normalizeManifestSourceUrl(
    process.env.OCCASION_PHOTO_MANIFEST_URL!
  );

  if (!url) {
    throw new Error(
      'OCCASION_PHOTO_MANIFEST_URL environment variable is not set'
    );
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Manifest request failed (status ${response.status})`);
  }

  const payload = (await response.json()) as OccasionManifest;
  return payload;
}

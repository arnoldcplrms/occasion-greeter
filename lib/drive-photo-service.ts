import type { Occasion } from './types';
import {
  extractDriveFileId,
  normalizeEmailBase,
  normalizeSurnameBase,
} from './utils';

type LookupStatus = 'found' | 'missing' | 'not-configured' | 'error';

export interface PhotoLookupResult {
  status: LookupStatus;
  url: string;
  message?: string;
  attemptedFileName?: string;
}

export interface OccasionManifest {
  birthday?: Record<string, string>;
  wedding_anniversary?: Record<string, string>;
  wedding_annivesary?: Record<string, string>;
}

export function normalizeManifestPhotoUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  const driveFileId = extractDriveFileId(trimmed);
  if (driveFileId) {
    return `https://drive.google.com/uc?export=view&id=${driveFileId}`;
  }

  return trimmed;
}

async function lookupFromManifest(
  group: 'birthday' | 'wedding_anniversary',
  lookupKey: string,
  manifest: OccasionManifest
): Promise<PhotoLookupResult> {
  if (!manifest) {
    return {
      status: 'not-configured',
      url: '',
      message:
        'Occasion manifest is not configured. Falling back to existing profile picture when available.',
    };
  }

  try {
    const bucket =
      group === 'birthday'
        ? manifest.birthday || {}
        : manifest.wedding_anniversary || manifest.wedding_annivesary || {};

    const rawUrl = bucket[lookupKey] || '';
    const url = normalizeManifestPhotoUrl(rawUrl);

    if (url) {
      return {
        status: 'found',
        url,
        attemptedFileName: lookupKey,
      };
    }

    return {
      status: 'missing',
      url: '',
      attemptedFileName: lookupKey,
      message: 'No celebrant photo available for this occasion.',
    };
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);

    return {
      status: 'error',
      url: '',
      attemptedFileName: lookupKey,
      message: `Unable to fetch celebrant photo manifest (${details}).`,
    };
  }
}

export async function resolveOccasionPhoto(
  occasion: Occasion,
  manifest: OccasionManifest
): Promise<PhotoLookupResult> {
  if (occasion.type === 'birthday' && occasion.person) {
    const lookupKey = normalizeEmailBase(occasion.person.email);

    if (!lookupKey) {
      return {
        status: 'missing',
        url: '',
        message: 'No celebrant photo available for this occasion.',
      };
    }

    return lookupFromManifest('birthday', lookupKey, manifest);
  }

  if (occasion.type === 'anniversary' && occasion.couple) {
    const lookupKey = normalizeSurnameBase(occasion.couple.maleLastName);

    if (!lookupKey) {
      return {
        status: 'missing',
        url: '',
        message: 'No celebrant photo available for this occasion.',
      };
    }

    return lookupFromManifest('wedding_anniversary', lookupKey, manifest);
  }

  return {
    status: 'error',
    url: '',
    message: 'Invalid occasion type for photo lookup.',
  };
}

import type { OccasionData } from './types';

/**
 * Maps exact Google Sheets column headers to camelCase field names.
 * Unrecognised headers are passed through as-is so camelCase CSVs still work.
 */
const SHEET_COLUMN_MAP: Record<string, string> = {
  "Male's First Name": 'maleName',
  "Male's Last Name": 'maleLastName',
  "Male's Nickname (If Applicable)": 'maleNickname',
  "Male's Birthday": 'maleBirthday',
  "Male's Email Address": 'maleEmail',
  "Male's Profile Picture": 'maleProfilePicture',
  "Female's First Name": 'femaleName',
  "Female's Last Name": 'femaleLastName',
  "Female's Nickname (If Applicable)": 'femaleNickname',
  "Female's Birthday": 'femaleBirthday',
  "Female's Email Address": 'femaleEmail',
  "Female's Profile Picture": 'femaleProfilePicture',
  "Couple's Profile Picture": 'weddingProfilePicture',
  'Wedding Anniversary (If engaged, set the future date/ If Not Applicable Skip)':
    'weddingAnniversary',
};

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

/**
 * Split raw CSV text into logical rows, correctly handling quoted fields that
 * contain embedded newlines (e.g. multi-line Google Sheets cells).
 */
function splitCsvIntoRows(csvText: string): string[] {
  const rows: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const next = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '""';
        i++;
      } else {
        inQuotes = !inQuotes;
        current += char;
      }
      continue;
    }

    if (!inQuotes && (char === '\n' || (char === '\r' && next === '\n'))) {
      if (char === '\r') i++;
      if (current.trim()) rows.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) rows.push(current);
  return rows;
}

function parseRawCsvRows(csvText: string): Record<string, string>[] {
  const rows = splitCsvIntoRows(csvText);

  if (rows.length === 0) {
    return [];
  }

  const headers = parseCsvLine(rows[0]);

  return rows.slice(1).map((row) => {
    const values = parseCsvLine(row);
    const result: Record<string, string> = {};

    for (let i = 0; i < headers.length; i++) {
      const rawHeader = headers[i];
      const mappedKey = SHEET_COLUMN_MAP[rawHeader] ?? rawHeader;
      result[mappedKey] = values[i] ?? '';
    }

    return result;
  });
}

function parseOccasionsCsv(csvText: string): OccasionData[] {
  const rows = parseRawCsvRows(csvText);

  return rows.map((row, index) => {
    const rowNumber = index + 2; // +1 for 0-based index, +1 for CSV header row
    const get = (key: string): string => row[key] ?? '';
    const require = (key: string): string => {
      if (!row[key]) {
        throw new Error(
          `CSV row ${rowNumber}: missing required column '${key}'`
        );
      }
      return row[key];
    };

    const maleLastName = get('maleLastName') || get('coupleLastName');

    return {
      maleName: require('maleName'),
      maleLastName,
      femaleName: require('femaleName'),
      femaleLastName: get('femaleLastName'),
      maleNickname: get('maleNickname'),
      femaleNickname: get('femaleNickname'),
      maleBirthday: get('maleBirthday'),
      femaleBirthday: get('femaleBirthday'),
      maleEmail: get('maleEmail'),
      femaleEmail: get('femaleEmail'),
      maleProfilePicture: get('maleProfilePicture'),
      femaleProfilePicture: get('femaleProfilePicture'),
      coupleLastName: maleLastName,
      weddingAnniversary: get('weddingAnniversary'),
      weddingProfilePicture: get('weddingProfilePicture'),
    };
  });
}

// Google Sheets document IDs are 44 chars; regular Drive file IDs are ~28.
function looksLikeSheetsId(id: string): boolean {
  return id.length >= 40;
}

function sheetsExportUrl(fileId: string): string {
  return `https://docs.google.com/spreadsheets/d/${fileId}/export?format=csv`;
}

function driveDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

function resolveGoogleDriveCsvDownloadUrl(source: string): string {
  const trimmed = source.trim();

  if (!trimmed.includes('://')) {
    // Bare file ID - detect Sheets vs Drive by length
    return looksLikeSheetsId(trimmed)
      ? sheetsExportUrl(trimmed)
      : driveDownloadUrl(trimmed);
  }

  // Google Sheets URL (docs.google.com/spreadsheets/...)
  if (trimmed.includes('docs.google.com/spreadsheets')) {
    const fileId = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
    if (fileId) {
      return sheetsExportUrl(fileId);
    }
  }

  if (trimmed.includes('drive.google.com')) {
    const fileId =
      trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1] ??
      trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1];

    if (fileId) {
      return looksLikeSheetsId(fileId)
        ? sheetsExportUrl(fileId)
        : driveDownloadUrl(fileId);
    }
  }

  return trimmed;
}

/**
 * Load and parse occasions data from CSV_URL environment variable
 * @returns Parsed occasions data array
 */
export async function loadOccasionsData(): Promise<OccasionData[]> {
  const csvSource = process.env.CSV_URL;

  if (!csvSource) {
    throw new Error('CSV_URL environment variable is not set');
  }

  const response = await fetch(csvSource);

  if (!response.ok) {
    throw new Error(`Failed to download CSV_URL (status ${response.status})`);
  }

  const csvText = await response.text();
  return parseOccasionsCsv(csvText);
}

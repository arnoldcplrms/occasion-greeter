import type { OccasionData } from './types';

/**
 * Legacy Couple format (from original JSON)
 */
interface LegacyPerson {
  firstName: string;
  lastName: string;
  nickname: string;
  birthday: string;
  email: string;
  contactNumber: string;
  profilePicture: string;
}

interface LegacyCouple {
  timestamp: string;
  male: LegacyPerson;
  female: LegacyPerson;
  weddingAnniversary: string;
  coupleProfilePicture: string;
  attendingBranch: string;
  maleMinistry: string;
  femaleMinistry: string;
  coupleActivities: string;
  maleActivitiesAttended: string;
  femaleActivitiesAttended: string;
}

/**
 * Transform legacy couple format to flattened occasions format
 * @param couple Legacy couple data
 * @returns Flattened occasion data
 */
function transformCoupleToOccasion(couple: LegacyCouple): OccasionData {
  return {
    maleName: couple.male.firstName,
    femaleName: couple.female.firstName,
    maleNickname: couple.male.nickname,
    femaleNickname: couple.female.nickname,
    maleBirthday: couple.male.birthday,
    femaleBirthday: couple.female.birthday,
    maleProfilePicture: couple.male.profilePicture,
    femaleProfilePicture: couple.female.profilePicture,
    coupleLastName: couple.male.lastName,
    weddingAnniversary: couple.weddingAnniversary,
    weddingProfilePicture: couple.coupleProfilePicture,
  };
}

/**
 * Load and parse occasions data from environment variable
 * Handles both legacy couple format and new flattened occasions format
 * @returns Parsed occasions data array
 */
export function loadOccasionsData(): OccasionData[] {
  const dataEnv = process.env.COUPLES_DATA;

  if (!dataEnv) {
    throw new Error('COUPLES_DATA environment variable is not set');
  }

  try {
    const data = JSON.parse(dataEnv);
    if (!Array.isArray(data)) {
      throw new Error('COUPLES_DATA must be a valid JSON array');
    }

    // Check if it's already in the new format or needs transformation
    if (data.length === 0) {
      return [];
    }

    const firstItem = data[0];

    // If it has 'male' and 'female' properties, it's the legacy format
    if ('male' in firstItem && 'female' in firstItem) {
      console.log('ℹ️  Converting legacy couple format to occasions format...');
      return data.map((couple: LegacyCouple) =>
        transformCoupleToOccasion(couple)
      );
    }

    // Otherwise, assume it's already in the new format
    return data as OccasionData[];
  } catch (error) {
    throw new Error(
      `Failed to parse COUPLES_DATA: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

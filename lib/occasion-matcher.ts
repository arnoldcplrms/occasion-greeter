import type { OccasionData, Occasion } from './types';

/**
 * Parse a date string in DD/MM/YYYY format
 * @param dateStr Date string in DD/MM/YYYY format
 * @returns Object with day and month, or null if invalid
 */
function parseDate(dateStr: string): { day: number; month: number } | null {
  if (!dateStr || dateStr.trim() === '') {
    return null;
  }

  const parts = dateStr.split('/');
  if (parts.length !== 3) {
    return null;
  }

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);

  if (
    isNaN(day) ||
    isNaN(month) ||
    day < 1 ||
    day > 31 ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  return { day, month };
}

/**
 * Get today's date in PH timezone
 * @returns Object with day and month
 */
function getTodayPH(): { day: number; month: number } {
  const now = new Date();
  const phTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'Asia/Manila' })
  );

  // return {
  //   day: phTime.getDate(),
  //   month: phTime.getMonth() + 1,
  // };

  return {
    day: 23,
    month: 12,
  };
}

/**
 * Find all occasions (birthdays and anniversaries) today
 * @param occasionsData Array of occasion data
 * @returns Array of occasions happening today
 */
export function findOccasionsToday(occasionsData: OccasionData[]): Occasion[] {
  const today = getTodayPH();
  const occasions: Occasion[] = [];

  for (const data of occasionsData) {
    // Check male's birthday
    const maleBirthday = parseDate(data.maleBirthday);
    if (
      maleBirthday &&
      maleBirthday.day === today.day &&
      maleBirthday.month === today.month
    ) {
      occasions.push({
        type: 'birthday',
        person: {
          name: data.maleName,
          nickname: data.maleNickname || data.maleName,
          profilePicture: data.maleProfilePicture,
        },
      });
    }

    // Check female's birthday
    const femaleBirthday = parseDate(data.femaleBirthday);
    if (
      femaleBirthday &&
      femaleBirthday.day === today.day &&
      femaleBirthday.month === today.month
    ) {
      occasions.push({
        type: 'birthday',
        person: {
          name: data.femaleName,
          nickname: data.femaleNickname || data.femaleName,
          profilePicture: data.femaleProfilePicture,
        },
      });
    }

    // Check wedding anniversary
    const anniversary = parseDate(data.weddingAnniversary);
    if (
      anniversary &&
      anniversary.day === today.day &&
      anniversary.month === today.month
    ) {
      occasions.push({
        type: 'anniversary',
        couple: {
          lastName: data.coupleLastName,
          profilePicture: data.weddingProfilePicture,
        },
      });
    }
  }

  return occasions;
}

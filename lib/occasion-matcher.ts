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
 * Get PH timezone date parts with optional day offset
 * @param dayOffset Number of days to offset from today (PH time)
 * @returns Object with day and month
 */
function getDatePH(dayOffset = 0): { day: number; month: number } {
  const now = new Date();
  const phTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'Asia/Manila' })
  );

  if (dayOffset !== 0) {
    phTime.setDate(phTime.getDate() + dayOffset);
  }

  return {
    day: phTime.getDate(),
    month: phTime.getMonth() + 1,
  };
}

function findOccasionsForDate(
  occasionsData: OccasionData[],
  targetDate: { day: number; month: number }
): Occasion[] {
  const occasions: Occasion[] = [];

  for (const data of occasionsData) {
    // Check male's birthday
    const maleBirthday = parseDate(data.maleBirthday);
    if (
      maleBirthday &&
      maleBirthday.day === targetDate.day &&
      maleBirthday.month === targetDate.month
    ) {
      occasions.push({
        type: 'birthday',
        person: {
          name: data.maleName,
          nickname: data.maleNickname || data.maleName,
          email: data.maleEmail,
          profilePicture: data.maleProfilePicture,
        },
      });
    }

    // Check female's birthday
    const femaleBirthday = parseDate(data.femaleBirthday);
    if (
      femaleBirthday &&
      femaleBirthday.day === targetDate.day &&
      femaleBirthday.month === targetDate.month
    ) {
      occasions.push({
        type: 'birthday',
        person: {
          name: data.femaleName,
          nickname: data.femaleNickname || data.femaleName,
          email: data.femaleEmail,
          profilePicture: data.femaleProfilePicture,
        },
      });
    }

    // Check wedding anniversary
    const anniversary = parseDate(data.weddingAnniversary);
    if (
      anniversary &&
      anniversary.day === targetDate.day &&
      anniversary.month === targetDate.month
    ) {
      occasions.push({
        type: 'anniversary',
        couple: {
          lastName: data.coupleLastName,
          maleLastName: data.maleLastName,
          profilePicture: data.weddingProfilePicture,
        },
      });
    }
  }

  return occasions;
}

function addDaysToDateParts(
  dateParts: { day: number; month: number },
  daysToAdd: number
): { day: number; month: number } {
  const syntheticDate = new Date(2000, dateParts.month - 1, dateParts.day);
  syntheticDate.setDate(syntheticDate.getDate() + daysToAdd);

  return {
    day: syntheticDate.getDate(),
    month: syntheticDate.getMonth() + 1,
  };
}

/**
 * Find all occasions (birthdays and anniversaries) today
 * @param occasionsData Array of occasion data
 * @returns Array of occasions happening today
 */
export function findOccasionsToday(occasionsData: OccasionData[]): Occasion[] {
  return findOccasionsForDate(occasionsData, getDatePH());
}

/**
 * Find all occasions happening tomorrow (PH timezone)
 * @param occasionsData Array of occasion data
 * @returns Array of occasions happening tomorrow
 */
export function findOccasionsTomorrow(
  occasionsData: OccasionData[]
): Occasion[] {
  const today = getDatePH();
  const tomorrow = addDaysToDateParts(today, 1);

  return findOccasionsForDate(occasionsData, tomorrow);
}

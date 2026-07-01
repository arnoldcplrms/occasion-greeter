import {
  BIRTHDAY_GREETINGS,
  WEDDING_ANNIVERSARY_GREETINGS,
} from '../constants';
import type { Occasion } from './types';

function pickRandom(templates: string[]): string {
  return templates[Math.floor(Math.random() * templates.length)];
}

export function generateGreeting(occasion: Occasion): string {
  if (occasion.type === 'birthday' && occasion.person) {
    return pickRandom(BIRTHDAY_GREETINGS).replace(
      '<<nickname>>',
      occasion.person.nickname
    );
  }

  if (occasion.type === 'anniversary' && occasion.couple) {
    return pickRandom(WEDDING_ANNIVERSARY_GREETINGS).replace(
      '<<lastName>>',
      occasion.couple.lastName
    );
  }

  return '';
}

export function generateReminderGreeting(occasion: Occasion): string {
  if (occasion.type === 'birthday' && occasion.person) {
    return `Reminder: Tomorrow is ${occasion.person.name}'s birthday. Please prepare to greet and pray for ${occasion.person.nickname}.`;
  }

  if (occasion.type === 'anniversary' && occasion.couple) {
    return `Reminder: Tomorrow is Team ${occasion.couple.lastName}'s wedding anniversary. Please prepare to celebrate and pray for their marriage.`;
  }

  return '';
}

function formatReminderListItem(occasion: Occasion): string {
  if (occasion.type === 'birthday' && occasion.person) {
    return `${occasion.person.name}'s birthday`;
  }

  if (occasion.type === 'anniversary' && occasion.couple) {
    return `Team ${occasion.couple.lastName}'s wedding anniversary`;
  }

  return 'An upcoming occasion';
}

export function generateBulkReminderGreeting(occasions: Occasion[]): string {
  const listItems = occasions.map(
    (occasion) => `- ${formatReminderListItem(occasion)}`
  );

  return [
    'Reminder: These occasions are happening tomorrow:',
    '',
    ...listItems,
  ].join('\n');
}

export function generateMonthlySummaryGreeting(
  occasions: Occasion[],
  monthName: string
): string {
  const header = `📋 Monthly Summary for ${monthName}`;

  if (occasions.length === 0) {
    return [
      header,
      '',
      'There are no occasions scheduled for this month.',
    ].join('\n');
  }

  const shortMonth = monthName.slice(0, 3);

  const birthdayEntries = occasions
    .filter((o) => o.type === 'birthday' && o.person)
    .map(
      (o) =>
        `🎂 ${o.person!.name}'s birthday (${shortMonth} ${o.day})`
    );

  const anniversaryEntries = occasions
    .filter((o) => o.type === 'anniversary' && o.couple)
    .map(
      (o) =>
        `💍 Team ${o.couple!.lastName}'s wedding anniversary (${shortMonth} ${o.day})`
    );

  const listItems = [...birthdayEntries, ...anniversaryEntries];

  return [
    header,
    '',
    ...listItems,
    '',
    `Total: ${occasions.length} occasion(s) this month.`,
  ].join('\n');
}

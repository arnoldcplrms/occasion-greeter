import {
  BIRTHDAY_GREETINGS,
  WEDDING_ANNIVERSARY_GREETINGS,
} from '../constants';
import type { Occasion } from './types';

/**
 * Select a random greeting and replace placeholders
 * @param occasion Occasion data (birthday or anniversary)
 * @returns Generated greeting message
 */
export function generateGreeting(occasion: Occasion): string {
  if (occasion.type === 'birthday' && occasion.person) {
    // Pick a random birthday greeting
    const randomIndex = Math.floor(Math.random() * BIRTHDAY_GREETINGS.length);
    let greeting = BIRTHDAY_GREETINGS[randomIndex];

    // Replace placeholder with nickname or name
    greeting = greeting.replace('<<nickname>>', occasion.person.nickname);

    return greeting;
  } else if (occasion.type === 'anniversary' && occasion.couple) {
    // Pick a random anniversary greeting
    const randomIndex = Math.floor(
      Math.random() * WEDDING_ANNIVERSARY_GREETINGS.length
    );
    let greeting = WEDDING_ANNIVERSARY_GREETINGS[randomIndex];

    // Replace placeholder with couple's last name
    greeting = greeting.replace('<<lastName>>', occasion.couple.lastName);

    return greeting;
  }

  return '';
}

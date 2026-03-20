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

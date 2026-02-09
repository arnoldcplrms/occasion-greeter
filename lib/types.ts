/**
 * Type definitions for the birthday and anniversary greeter application
 */

export interface OccasionData {
  maleName: string;
  femaleName: string;
  maleNickname: string;
  femaleNickname: string;
  maleBirthday: string; // Format: DD/MM/YYYY
  femaleBirthday: string; // Format: DD/MM/YYYY
  maleProfilePicture: string;
  femaleProfilePicture: string;
  coupleLastName: string;
  weddingAnniversary: string; // Format: DD/MM/YYYY
  weddingProfilePicture: string;
}

export interface Occasion {
  type: 'birthday' | 'anniversary';
  person?: {
    name: string;
    nickname: string;
    profilePicture: string;
  };
  couple?: {
    lastName: string;
    profilePicture: string;
  };
}

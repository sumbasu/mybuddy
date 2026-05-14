export interface Interest {
  id: string;
  label: string;
  emoji: string;
  category: 'sports' | 'fitness';
}

export const INTERESTS: Interest[] = [
  // Sports
  { id: 'tennis',      label: 'Tennis',        emoji: '🎾', category: 'sports' },
  { id: 'badminton',   label: 'Badminton',      emoji: '🏸', category: 'sports' },
  { id: 'cricket',     label: 'Cricket',        emoji: '🏏', category: 'sports' },
  { id: 'football',    label: 'Football',       emoji: '⚽', category: 'sports' },
  { id: 'basketball',  label: 'Basketball',     emoji: '🏀', category: 'sports' },
  { id: 'swimming',    label: 'Swimming',       emoji: '🏊', category: 'sports' },
  { id: 'cycling',     label: 'Cycling',        emoji: '🚴', category: 'sports' },
  { id: 'squash',      label: 'Squash',         emoji: '🎱', category: 'sports' },
  { id: 'tabletennis', label: 'Table Tennis',   emoji: '🏓', category: 'sports' },

  // Fitness
  { id: 'running',     label: 'Running',        emoji: '🏃', category: 'fitness' },
  { id: 'jogging',     label: 'Jogging',        emoji: '👟', category: 'fitness' },
  { id: 'gym',         label: 'Gym',            emoji: '💪', category: 'fitness' },
  { id: 'yoga',        label: 'Yoga',           emoji: '🧘', category: 'fitness' },
  { id: 'hiking',      label: 'Hiking',         emoji: '🥾', category: 'fitness' },
  { id: 'walking',     label: 'Morning Walk',   emoji: '🚶', category: 'fitness' },
];

export const INTEREST_CATEGORIES = [
  { id: 'sports',  label: 'Sports' },
  { id: 'fitness', label: 'Fitness' },
];

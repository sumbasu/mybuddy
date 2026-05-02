export interface Interest {
  id: string;
  label: string;
  emoji: string;
  category: 'sports' | 'social' | 'fitness' | 'entertainment';
}

export const INTERESTS: Interest[] = [
  // Sports
  { id: 'tennis', label: 'Tennis', emoji: '🎾', category: 'sports' },
  { id: 'badminton', label: 'Badminton', emoji: '🏸', category: 'sports' },
  { id: 'cricket', label: 'Cricket', emoji: '🏏', category: 'sports' },
  { id: 'football', label: 'Football', emoji: '⚽', category: 'sports' },
  { id: 'basketball', label: 'Basketball', emoji: '🏀', category: 'sports' },
  { id: 'swimming', label: 'Swimming', emoji: '🏊', category: 'sports' },
  { id: 'cycling', label: 'Cycling', emoji: '🚴', category: 'sports' },
  { id: 'squash', label: 'Squash', emoji: '🎱', category: 'sports' },
  { id: 'tabletennis', label: 'Table Tennis', emoji: '🏓', category: 'sports' },

  // Fitness
  { id: 'running', label: 'Running', emoji: '🏃', category: 'fitness' },
  { id: 'jogging', label: 'Jogging', emoji: '👟', category: 'fitness' },
  { id: 'gym', label: 'Gym', emoji: '💪', category: 'fitness' },
  { id: 'yoga', label: 'Yoga', emoji: '🧘', category: 'fitness' },
  { id: 'hiking', label: 'Hiking', emoji: '🥾', category: 'fitness' },
  { id: 'walking', label: 'Morning Walk', emoji: '🚶', category: 'fitness' },

  // Social
  { id: 'coffee', label: 'Coffee', emoji: '☕', category: 'social' },
  { id: 'lunch', label: 'Lunch', emoji: '🍱', category: 'social' },
  { id: 'networking', label: 'Networking', emoji: '🤝', category: 'social' },
  { id: 'boardgames', label: 'Board Games', emoji: '🎲', category: 'social' },

  // Entertainment
  { id: 'movies', label: 'Movies', emoji: '🎬', category: 'entertainment' },
  { id: 'concerts', label: 'Concerts', emoji: '🎵', category: 'entertainment' },
  { id: 'trekking', label: 'Trekking', emoji: '🏔️', category: 'entertainment' },
  { id: 'photography', label: 'Photography', emoji: '📷', category: 'entertainment' },
];

export const INTEREST_CATEGORIES = [
  { id: 'sports', label: 'Sports' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'social', label: 'Social' },
  { id: 'entertainment', label: 'Entertainment' },
];

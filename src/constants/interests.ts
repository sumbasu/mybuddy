export interface Interest {
  id: string;
  label: string;
  icon: string; // MaterialCommunityIcons name
  category: 'sports' | 'fitness';
}

export const INTERESTS: Interest[] = [
  // Sports
  { id: 'tennis',      label: 'Tennis',        icon: 'tennis',       category: 'sports' },
  { id: 'badminton',   label: 'Badminton',      icon: 'badminton',    category: 'sports' },
  { id: 'cricket',     label: 'Cricket',        icon: 'cricket',      category: 'sports' },
  { id: 'football',    label: 'Football',       icon: 'soccer',       category: 'sports' },
  { id: 'basketball',  label: 'Basketball',     icon: 'basketball',   category: 'sports' },
  { id: 'swimming',    label: 'Swimming',       icon: 'swim',         category: 'sports' },
  { id: 'cycling',     label: 'Cycling',        icon: 'bike',         category: 'sports' },
  { id: 'squash',      label: 'Squash',         icon: 'racquetball',  category: 'sports' },
  { id: 'tabletennis', label: 'Table Tennis',   icon: 'table-tennis', category: 'sports' },

  // Fitness
  { id: 'running',     label: 'Running',        icon: 'run',          category: 'fitness' },
  { id: 'jogging',     label: 'Jogging',        icon: 'run-fast',     category: 'fitness' },
  { id: 'gym',         label: 'Gym',            icon: 'dumbbell',     category: 'fitness' },
  { id: 'yoga',        label: 'Yoga',           icon: 'yoga',         category: 'fitness' },
  { id: 'hiking',      label: 'Hiking',         icon: 'hiking',       category: 'fitness' },
  { id: 'walking',     label: 'Morning Walk',   icon: 'walk',         category: 'fitness' },
];

export const INTEREST_CATEGORIES = [
  { id: 'sports',  label: 'Sports' },
  { id: 'fitness', label: 'Fitness' },
];

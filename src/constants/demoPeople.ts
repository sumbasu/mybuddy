export interface DemoPerson {
  id: string;
  name: string;
  city: string;
  distanceKm: number;
  interests: string[]; // ids from INTERESTS
}

export const DEMO_PEOPLE: DemoPerson[] = [
  { id: 'dp1', name: 'Marcus Webb',  city: 'Bengaluru', distanceKm: 1.2,  interests: ['tennis', 'badminton', 'cricket'] },
  { id: 'dp2', name: 'Tom Alcott',   city: 'Bengaluru', distanceKm: 3.7,  interests: ['tennis', 'basketball', 'squash'] },
  { id: 'dp3', name: 'Diego Lomas',  city: 'Mumbai',    distanceKm: 840,  interests: ['squash', 'tennis', 'badminton'] },
  { id: 'dp4', name: 'Sophia Renard',city: 'Chennai',   distanceKm: 341,  interests: ['tennis', 'yoga', 'running'] },
  { id: 'dp5', name: 'Layla Durant', city: 'Pune',      distanceKm: 843,  interests: ['badminton', 'tabletennis', 'tennis'] },
  { id: 'dp6', name: 'Priya Menon',  city: 'Bengaluru', distanceKm: 2.4,  interests: ['yoga', 'running', 'gym'] },
  { id: 'dp7', name: 'Arjun Nair',   city: 'Bengaluru', distanceKm: 5.1,  interests: ['football', 'cricket', 'gym'] },
];

export interface DemoPerson {
  id: string;
  name: string;
  gender: 'M' | 'F';
  city: string;
  distanceKm: number;
  interests: string[]; // ids from INTERESTS
}

export const DEMO_PEOPLE: DemoPerson[] = [
  { id: 'dp1', name: 'Marcus Webb',   gender: 'M', city: 'Bengaluru', distanceKm: 1.2,  interests: ['tennis', 'badminton', 'cricket'] },
  { id: 'dp2', name: 'Tom Alcott',    gender: 'M', city: 'Bengaluru', distanceKm: 3.7,  interests: ['tennis', 'basketball', 'squash'] },
  { id: 'dp3', name: 'Diego Lomas',   gender: 'M', city: 'Mumbai',    distanceKm: 840,  interests: ['squash', 'tennis', 'badminton'] },
  { id: 'dp4', name: 'Sophia Renard', gender: 'F', city: 'Chennai',   distanceKm: 341,  interests: ['tennis', 'yoga', 'running'] },
  { id: 'dp5', name: 'Layla Durant',  gender: 'F', city: 'Pune',      distanceKm: 843,  interests: ['badminton', 'tabletennis', 'tennis'] },
  { id: 'dp6', name: 'Priya Menon',   gender: 'F', city: 'Bengaluru', distanceKm: 2.4,  interests: ['yoga', 'running', 'gym'] },
  { id: 'dp7', name: 'Arjun Nair',    gender: 'M', city: 'Bengaluru', distanceKm: 5.1,  interests: ['football', 'cricket', 'gym'] },
];

export interface DemoRequest {
  id: string;
  person: DemoPerson;
  timeAgo: string;
}

// Incoming connection requests — mock data, UI only
export const DEMO_REQUESTS: DemoRequest[] = [
  { id: 'req1', person: DEMO_PEOPLE[0], timeAgo: '2h ago' },
  { id: 'req2', person: DEMO_PEOPLE[4], timeAgo: '5h ago' },
  { id: 'req3', person: DEMO_PEOPLE[3], timeAgo: '1d ago' },
];

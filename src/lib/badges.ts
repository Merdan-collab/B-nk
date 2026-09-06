export interface BadgeDefinition {
  id: string;
  emoji: string;
  name: string;
  description: string;
  isEarned: (stats: ProfileStats) => boolean;
}

export interface ProfileStats {
  benchesVisited: number;
  districtsVisited: number;
  checkinCount: number;
  ratingCount: number;
  photoCount: number;
  benchesCreated: number;
}

export const BADGES: BadgeDefinition[] = [
  {
    id: 'bankejaeger',
    emoji: '🏆',
    name: 'Bænkejæger',
    description: 'Besøgt 10 forskellige bænke',
    isEarned: (s) => s.benchesVisited >= 10,
  },
  {
    id: 'solnedgangsjaeger',
    emoji: '🌅',
    name: 'Solnedgangsjæger',
    description: 'Checket ind på 5 solbænke',
    isEarned: (s) => s.checkinCount >= 5,
  },
  {
    id: 'kbh-explorer',
    emoji: '🗺️',
    name: 'København Explorer',
    description: 'Besøgt bænke i 5 forskellige bydele',
    isEarned: (s) => s.districtsVisited >= 5,
  },
  {
    id: 'baenkeanmelder',
    emoji: '⭐',
    name: 'Bænkeanmelder',
    description: 'Afgivet 10 ratings',
    isEarned: (s) => s.ratingCount >= 10,
  },
  {
    id: 'baenkelegende',
    emoji: '👑',
    name: 'Bænkelegende',
    description: 'Besøgt 50 bænke og tilføjet mindst 3 selv',
    isEarned: (s) => s.benchesVisited >= 50 && s.benchesCreated >= 3,
  },
];

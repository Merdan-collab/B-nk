export const BENCH_TAGS = [
  'udsigt',
  'sol',
  'skygge',
  'ro',
  'hygge',
  'romantisk',
  'socialt',
  'vandkant',
  'park',
  'natur',
  'aften',
  'hund-venlig',
  'boernevenlig',
] as const;

export type BenchTag = (typeof BENCH_TAGS)[number];

export interface ExploreCategory {
  id: string;
  emoji: string;
  title: string;
}

export const EXPLORE_CATEGORIES: ExploreCategory[] = [
  { id: 'popular', emoji: '🔥', title: 'Populære lige nu' },
  { id: 'top-rated', emoji: '⭐', title: 'Bedst ratede' },
  { id: 'best-view', emoji: '🌅', title: 'Bedste udsigt' },
  { id: 'sunniest', emoji: '☀️', title: 'Bedste solbænke' },
  { id: 'evening', emoji: '🌙', title: 'Bedste aftenbænke' },
  { id: 'romantic', emoji: '❤️', title: 'Mest romantiske' },
  { id: 'calm', emoji: '🌳', title: 'Mest rolige' },
  { id: 'social', emoji: '👥', title: 'Mest sociale' },
  { id: 'nearby', emoji: '📍', title: 'Tæt på dig' },
  { id: 'new', emoji: '🆕', title: 'Nye bænke' },
];

export const DEFAULT_MAP_CENTER = {
  lat: Number(process.env.NEXT_PUBLIC_DEFAULT_LAT ?? 55.6761),
  lng: Number(process.env.NEXT_PUBLIC_DEFAULT_LNG ?? 12.5683),
};

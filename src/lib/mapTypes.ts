export interface MapBench {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  district: string | null;
  tags: string[];
  verified: boolean;
  average_rating: number;
  rating_count: number;
  distance_meters: number;
  cover_photo_url: string | null;
  active_checkins: number;
}

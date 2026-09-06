export type Visibility = 'private' | 'friends' | 'public';
export type FriendshipStatus = 'pending' | 'accepted' | 'declined';
export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'bench_shared'
  | 'nearby_friend_checkin'
  | 'new_review'
  | 'new_rating';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  notify_friend_requests: boolean;
  notify_nearby_friend_checkins: boolean;
  notify_bench_reviews: boolean;
  notify_shares: boolean;
  created_at: string;
}

export interface Bench {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  district: string | null;
  tags: string[];
  created_by: string | null;
  created_at: string;
  verified: boolean;
  average_rating: number;
  rating_count: number;
  avg_view: number;
  avg_comfort: number;
  avg_coziness: number;
  avg_quiet: number;
  avg_sun: number;
  avg_location_score: number;
}

export interface BenchWithLocation extends Bench {
  latitude: number;
  longitude: number;
}

export interface NearbyBench {
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
}

export interface Rating {
  id: string;
  bench_id: string;
  user_id: string;
  overall: number;
  view: number | null;
  comfort: number | null;
  coziness: number | null;
  quiet: number | null;
  sun: number | null;
  location_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  bench_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: Profile;
}

export interface Photo {
  id: string;
  bench_id: string;
  user_id: string;
  storage_path: string;
  caption: string | null;
  like_count: number;
  created_at: string;
  profiles?: Profile;
}

export interface Checkin {
  id: string;
  user_id: string;
  bench_id: string;
  checked_in_at: string;
  expires_at: string;
  visibility: Visibility;
  active: boolean;
  profiles?: Profile;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  responded_at: string | null;
}

export interface Favorite {
  id: string;
  user_id: string;
  bench_id: string;
  created_at: string;
}

export interface BenchList {
  id: string;
  user_id: string;
  name: string;
  is_shared_with_friends: boolean;
  created_at: string;
}

export interface ListItem {
  id: string;
  list_id: string;
  bench_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

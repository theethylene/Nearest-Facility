export type HealthPost = {
  id: string;
  name: string;
  address: string;
  postal_code: string;
  latitude: number;
  longitude: number;
};

const UNAVAILABLE_MARKERS = ['by referral only', 'temporarily closed'];

/**
 * Filters out Community Health Posts that a walk-in visitor can't actually
 * use right now — posts whose name is suffixed "(by referral only)" or
 * "(temporarily closed)" in the source data.
 */
export function filterAvailablePosts(posts: HealthPost[]): HealthPost[] {
  return posts.filter((post) => {
    const lowerName = post.name.toLowerCase();
    return !UNAVAILABLE_MARKERS.some((marker) => lowerName.includes(marker));
  });
}

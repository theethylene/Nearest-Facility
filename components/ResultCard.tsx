export type NearestPost = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
};

type ResultCardProps = {
  post: NearestPost;
  rank: number; // 0 = nearest, 1 = second-nearest, etc.
};

const RANK_LABEL: Record<number, string> = {
  0: 'Nearest',
  1: '2nd closest',
  2: '3rd closest',
};

export default function ResultCard({ post, rank }: ResultCardProps) {
  const isPrimary = rank === 0;
  const headingId = `result-heading-${post.id}`;

  return (
    <section
      className={`result-card${isPrimary ? ' result-card--primary' : ' result-card--alternate'}`}
      aria-labelledby={headingId}
    >
      <span className="result-card__badge">{RANK_LABEL[rank] ?? `#${rank + 1}`}</span>
      <h2 id={headingId}>{post.name}</h2>

      {/* Plain-text alternative to the map, so every result is fully usable
          without relying on the visual map. */}
      <dl>
        <dt>Address</dt>
        <dd>{post.address}</dd>

        <dt>Distance from you</dt>
        <dd>{post.distanceKm.toFixed(2)} km (straight-line)</dd>
      </dl>
    </section>
  );
}

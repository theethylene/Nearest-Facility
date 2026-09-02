export type NearestPost = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
};

export type ResultCategory = 'chp' | 'aac';

type ResultCardProps = {
  post: NearestPost;
  rank: number; // 0 = nearest, 1 = second-nearest, etc.
  category?: ResultCategory;
};

const RANK_LABEL: Record<number, string> = {
  0: 'Nearest',
  1: '2nd closest',
  2: '3rd closest',
};

export default function ResultCard({ post, rank, category = 'chp' }: ResultCardProps) {
  const isPrimary = rank === 0;
  const headingId = `result-heading-${category}-${post.id}`;

  const classNames = [
    'result-card',
    isPrimary ? 'result-card--primary' : 'result-card--alternate',
    category === 'aac' ? 'result-card--aac' : 'result-card--chp',
  ].join(' ');

  return (
    <section className={classNames} aria-labelledby={headingId}>
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

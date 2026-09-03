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

// Small line icons (no emoji, per house style) distinguishing the two
// facility categories at a glance: a cross-in-circle for Community Health
// Posts, two figures for Active Ageing Centres. Both use currentColor so
// the surrounding CSS (result-card__icon) controls the actual color per
// category/rank.
function ChpIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function AacIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="2.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 18c0-2.8 2.2-4.6 5-4.6s5 1.8 5 4.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.1" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M14.7 13.8c.9-.6 2-.9 2.3-.9 2.3 0 4 1.5 4 3.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
      <div className="result-card__title-row">
        <span className="result-card__icon">{category === 'aac' ? <AacIcon /> : <ChpIcon />}</span>
        <h2 id={headingId}>{post.name}</h2>
      </div>

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

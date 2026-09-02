export type NearestPost = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
};

export default function ResultCard({ post }: { post: NearestPost }) {
  return (
    <section className="result-card" aria-labelledby="result-heading">
      <h2 id="result-heading">{post.name}</h2>

      {/* Plain-text alternative to the map below, so the result is fully
          usable without relying on the visual map (screen readers, or the
          map simply not loading). */}
      <dl>
        <dt>Address</dt>
        <dd>{post.address}</dd>

        <dt>Distance from you</dt>
        <dd>{post.distanceKm.toFixed(2)} km (straight-line)</dd>
      </dl>
    </section>
  );
}

import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { count, error } = await supabase
    .from('health_posts')
    .select('*', { count: 'exact', head: true });

  return (
    <main>
      <h1>Nearest Community Health Post</h1>
      <p>Enter your postal code to find the nearest health post — coming in Phase One.</p>

      <div className={`status ${error ? 'error' : ''}`}>
        {error
          ? `Supabase connection error: ${error.message}`
          : `Supabase connected — ${count ?? 0} health post(s) loaded`}
      </div>

      <p className="note">
        This is a Phase Zero infrastructure checkpoint: Next.js on Vercel, wired to a
        Supabase database ready for the health post directory. Postal-code search,
        the map, and distance calculation are built in Phase One.
      </p>
    </main>
  );
}

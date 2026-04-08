import { NextResponse } from 'next/server';

// Revalidate once per day — Google Places quota is limited
export const revalidate = 86400;

export async function GET() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  // No credentials → return safe fallback so UI still renders
  if (!apiKey || !placeId) {
    return NextResponse.json(
      { rating: 5.0, reviewCount: null, reviews: [] },
      { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' } }
    );
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('fields', 'rating,user_ratings_total,reviews');
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString(), {
      next: { revalidate: 86400 },
    });

    const data = await res.json();

    if (data.status !== 'OK') {
      console.warn('[reviews] Google Places returned:', data.status, data.error_message);
      return NextResponse.json({ rating: 5.0, reviewCount: null, reviews: [] });
    }

    const result = data.result;

    return NextResponse.json(
      {
        rating: result.rating ?? 5.0,
        reviewCount: result.user_ratings_total ?? null,
        reviews: (result.reviews ?? [])
          .filter((r: { rating: number }) => r.rating >= 4)
          .slice(0, 3)
          .map((r: {
            author_name: string;
            text: string;
            rating: number;
            relative_time_description: string;
          }) => ({
            name: r.author_name,
            text: r.text,
            stars: r.rating,
            time: r.relative_time_description,
          })),
      },
      { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' } }
    );
  } catch (err) {
    console.error('[reviews] fetch error:', err);
    return NextResponse.json({ rating: 5.0, reviewCount: null, reviews: [] });
  }
}

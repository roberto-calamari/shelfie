import { NextRequest, NextResponse } from 'next/server';
import { searchAllProviders } from '@/providers';
import { searchRequestSchema } from '@/lib/validation';
import { searchCache } from '@/lib/cache';
import type { SearchResponse } from '@/types';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');

  const parsed = searchRequestSchema.safeParse({ query });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please enter a book title, author, or ISBN.' },
      { status: 400 }
    );
  }

  const q = parsed.data.query;

  // Check cache
  const cached = searchCache.get(q) as SearchResponse | undefined;
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const start = Date.now();
    const results = await searchAllProviders(q);
    const timing = Date.now() - start;

    const response: SearchResponse = { results, query: q, timing };
    searchCache.set(q, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Something went wrong with the search. Please try again.' },
      { status: 500 }
    );
  }
}

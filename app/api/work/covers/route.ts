import { NextRequest, NextResponse } from 'next/server';
import { getAllCovers } from '@/providers';
import { rankCovers } from '@/lib/covers/ranking';
import { coverCache } from '@/lib/cache';
import type { WorkSearchResult, CoversResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const work = body.work as WorkSearchResult;

    if (!work || !work.id) {
      return NextResponse.json({ error: 'Missing work data' }, { status: 400 });
    }

    // Check cache
    const cached = coverCache.get(work.id) as CoversResponse | undefined;
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch candidates from all providers
    const candidates = await getAllCovers(work);

    // Rank and score
    const ranked = await rankCovers(candidates);

    const response: CoversResponse = { covers: ranked, workId: work.id };
    coverCache.set(work.id, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Covers error:', error);
    return NextResponse.json(
      { error: 'Something went wrong fetching covers. Please try again.' },
      { status: 500 }
    );
  }
}

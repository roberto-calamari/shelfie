import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { dimensionCache } from '@/lib/cache';

const ALLOWED_HOSTS = [
  'covers.openlibrary.org',
  'books.google.com',
  'books.googleusercontent.com',
];

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const inspect = request.nextUrl.searchParams.get('inspect') === 'true';

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.some((h) => parsedUrl.hostname === h || parsedUrl.hostname.endsWith(`.${h}`))) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 403 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Shelfie/1.0 (https://github.com/shelfie/shelfie)',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: 502 }
      );
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    // Inspect mode: return dimensions as JSON
    if (inspect) {
      const metadata = await sharp(buffer).metadata();
      const dims = {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
      };
      dimensionCache.set(url, { width: dims.width, height: dims.height });
      return NextResponse.json(dims);
    }

    // Proxy mode: return the image with caching headers
    const metadata = await sharp(buffer).metadata();
    const contentType = metadata.format === 'png' ? 'image/png' : 'image/jpeg';

    // Cache dimensions as a side effect
    if (metadata.width && metadata.height) {
      dimensionCache.set(url, { width: metadata.width, height: metadata.height });
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Cover proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cover image.' },
      { status: 502 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { extractPalette } from '@/lib/styles';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Shelfie/1.0' },
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 });
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    // Resize to small sample for fast analysis
    const { dominant, channels } = await sharp(buffer)
      .resize(64, 64, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => {
        // Compute dominant color from raw pixel data
        const rSum = { r: 0, g: 0, b: 0, count: 0 };
        for (let i = 0; i < data.length; i += info.channels) {
          rSum.r += data[i];
          rSum.g += data[i + 1];
          rSum.b += data[i + 2];
          rSum.count++;
        }
        return {
          dominant: {
            r: Math.round(rSum.r / rSum.count),
            g: Math.round(rSum.g / rSum.count),
            b: Math.round(rSum.b / rSum.count),
          },
          channels: [],
        };
      });

    const palette = extractPalette(dominant);
    return NextResponse.json(palette);
  } catch (error) {
    console.error('Palette extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze cover image.' },
      { status: 500 }
    );
  }
}

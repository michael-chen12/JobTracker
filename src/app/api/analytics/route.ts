import { NextRequest, NextResponse } from 'next/server';
import { getAnalytics } from '@/actions/analytics';
import type { DateRangeFilter } from '@/types/analytics';

/**
 * GET /api/analytics
 *
 * Client-side analytics endpoint with date range filtering
 *
 * Query Parameters:
 * - range: '30' | '60' | '90' | 'all' (default: '30')
 *
 * @returns JSON with analytics data or error
 */
export async function GET(request: NextRequest) {
  try {
    // Extract and validate range query parameter
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '30';

    // Validate range parameter
    const validRanges: DateRangeFilter[] = ['30', '60', '90', 'all'];
    const dateRange = validRanges.includes(range as DateRangeFilter)
      ? (range as DateRangeFilter)
      : '30';

    // Call server action to get analytics
    const { data, error } = await getAnalytics(dateRange);

    // Handle errors
    if (error) {
      return NextResponse.json(
        { error, data: null },
        { status: error === 'Unauthorized' ? 401 : 500 }
      );
    }

    // Return analytics data
    return NextResponse.json(
      { data, error: null },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=60', // Cache for 60 seconds
        },
      }
    );
  } catch (error) {
    console.error('Error in analytics API route:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics',
        data: null
      },
      { status: 500 }
    );
  }
}

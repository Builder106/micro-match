import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { getClaims } from '$lib/server/appwrite';
import { getUserRole } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
  const { locals, request, url } = event;

  // Rate limiting (basic per-IP)
  const _clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown';
  // Note: In production, implement proper rate limiting with Redis/memory store

  // Authentication check
  const sessionUserId = locals.session?.user?.id;
  if (!sessionUserId) {
    return json({ error: 'Authentication required', data: null }, { status: 401 });
  }

  // Authorization check
  const role = await getUserRole(event);
  if (role === 'anonymous') {
    return json({ error: 'Invalid session', data: null }, { status: 401 });
  }

  // Only allow volunteers and NGOs to access their own claims
  if (role !== 'volunteer' && role !== 'ngo' && role !== 'user') {
    return json({ error: 'Insufficient permissions', data: null }, { status: 403 });
  }

  try {
    // Query parameters for filtering and pagination
    const statusFilter = url.searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Validate status filter
    if (statusFilter && !['pending', 'approved', 'rejected'].includes(statusFilter)) {
      return json({ error: 'Invalid status filter', data: null }, { status: 400 });
    }

    const claims = await getClaims({ userId: sessionUserId });

    // Apply filtering
    let filteredClaims = claims;
    if (statusFilter) {
      filteredClaims = claims.filter(claim => claim.status === statusFilter);
    }

    // Apply pagination
    const paginatedClaims = filteredClaims.slice(offset, offset + limit);
    const totalCount = filteredClaims.length;

    // Response with consistent envelope
    return json({
      data: paginatedClaims,
      meta: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      error: null
    }, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    // Structured error logging (avoid console.error in production)
    const errorId = crypto.randomUUID?.() || Date.now().toString();
    console.error(`Claims API Error [${errorId}]:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: sessionUserId,
      timestamp: new Date().toISOString()
    });

    // Don't leak internal error details
    return json({
      error: 'Internal server error',
      data: null
    }, { status: 500 });
  }
};

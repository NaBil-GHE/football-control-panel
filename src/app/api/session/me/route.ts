import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  getBackendApiBaseUrl,
  SESSION_COOKIE_NAME,
} from '@/lib/backend-url';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      },
      { status: 401 },
    );
  }

  try {
    const backendRes = await fetch(`${getBackendApiBaseUrl()}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      if (backendRes.status === 401) {
        cookieStore.delete(SESSION_COOKIE_NAME);
      }
      return NextResponse.json(data, { status: backendRes.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BACKEND_UNAVAILABLE',
          message: 'Could not reach the Football API server.',
        },
      },
      { status: 502 },
    );
  }
}

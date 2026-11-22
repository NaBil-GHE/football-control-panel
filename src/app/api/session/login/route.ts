import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  getBackendApiBaseUrl,
  SESSION_COOKIE_NAME,
} from '@/lib/backend-url';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const backendUrl = `${getBackendApiBaseUrl()}/auth/login`;

    const backendRes = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    const token: string | undefined = data?.data?.token;
    const user = data?.data?.user;

    if (!token || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'Unexpected login response from backend API.',
          },
        },
        { status: 502 },
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin role is required to access the Football Control Panel.',
          },
        },
        { status: 403 },
      );
    }

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    });

    return NextResponse.json({
      success: true,
      data: { user },
    });
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

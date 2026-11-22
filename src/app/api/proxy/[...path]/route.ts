import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import {
  getBackendApiBaseUrl,
  SESSION_COOKIE_NAME,
} from '@/lib/backend-url';

async function forwardRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  const targetPath = path.join('/');
  const search = request.nextUrl.search || '';
  const targetUrl = `${getBackendApiBaseUrl()}/${targetPath}${search}`;

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const text = await request.text();
    if (text) {
      body = text;
    }
  }

  try {
    const backendRes = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });

    if (backendRes.status === 401 && token) {
      cookieStore.delete(SESSION_COOKIE_NAME);
    }

    const resContentType =
      backendRes.headers.get('content-type') || 'application/json';
    const rawText = await backendRes.text();

    return new NextResponse(rawText, {
      status: backendRes.status,
      headers: { 'Content-Type': resContentType },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BACKEND_UNAVAILABLE',
          message: 'Football API backend is unreachable.',
        },
      },
      { status: 502 },
    );
  }
}

export const GET = forwardRequest;
export const POST = forwardRequest;
export const PATCH = forwardRequest;
export const DELETE = forwardRequest;

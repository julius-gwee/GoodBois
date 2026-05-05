import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

/**
 * POST /api/auth/send-magic-link
 *
 * Proxies magic-link requests to the FastAPI backend.
 * The browser never touches Supabase directly.
 */
export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const redirectTo = `${new URL(request.url).origin}/auth/callback`;

  const res = await fetch(`${BACKEND_URL}/auth/send-magic-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, redirect_to: redirectTo }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: body.detail ?? "Failed to send magic link" },
      { status: res.status }
    );
  }

  return NextResponse.json({ message: "Magic link sent" });
}

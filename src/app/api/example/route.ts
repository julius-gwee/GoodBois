import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

/**
 * GET /api/example
 *
 * Proxies data requests to the FastAPI backend.
 * All Supabase queries run server-side in FastAPI, never in the browser.
 */
export async function GET() {
  const res = await fetch(`${BACKEND_URL}/example/`);

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch data from backend" },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}


import { NextResponse } from "next/server";
import { searchEntities } from "@/lib/qloo";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const types = searchParams.get("types")?.trim() || undefined;

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchEntities(query, types);
    return NextResponse.json({ results });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message, results: [] }, { status: 500 });
  }
}

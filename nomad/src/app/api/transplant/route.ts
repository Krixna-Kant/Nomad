import { NextResponse } from "next/server";
import { transplantTaste } from "@/lib/transplant";
import type { ResolvedEntity } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      origin?: string;
      destination?: string;
      loves?: ResolvedEntity[];
    };

    const origin = body.origin?.trim() ?? "";
    const destination = body.destination?.trim() ?? "";
    const loves = body.loves ?? [];

    if (!origin || !destination) {
      return NextResponse.json(
        { error: "Origin and destination cities are required." },
        { status: 400 },
      );
    }
    if (loves.length < 2) {
      return NextResponse.json(
        { error: "Add at least two things you loved in your old city." },
        { status: 400 },
      );
    }

    const result = await transplantTaste(origin, destination, loves);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Transplant failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { addPin, listPins, toPublicPin } from "@/lib/pins";
import type { ResolvedEntity, TransplantResult } from "@/lib/types";

export async function GET() {
  const pins = await listPins();
  return NextResponse.json({ pins });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      result?: TransplantResult;
      loves?: ResolvedEntity[];
    };

    if (!body.result?.origin?.trim() || !body.result?.destination?.trim()) {
      return NextResponse.json(
        { error: "A pin needs an origin, a destination, and a result." },
        { status: 400 },
      );
    }

    const pin = await addPin(toPublicPin(body.result, body.loves ?? []));
    return NextResponse.json({ pin });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not pin";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

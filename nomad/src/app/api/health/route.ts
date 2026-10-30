import { NextResponse } from "next/server";
import { pingQloo } from "@/lib/qloo";

export async function GET() {
  try {
    const qloo = await pingQloo();
    return NextResponse.json({
      ok: qloo.ok,
      qloo,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Qloo error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

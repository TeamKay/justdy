
import { NextResponse } from "next/server";
import { recordVideoWatchEvent } from "@/app/actions/video-watch";

export async function POST(request: Request) {
  try {
    const input = await request.json();

    const result = await recordVideoWatchEvent(input);

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error("[Justdy video tracking] Final-save request failed:", error);

    return NextResponse.json(
      { success: false, error: "Unable to save video activity." },
      { status: 500 },
    );
  }
}

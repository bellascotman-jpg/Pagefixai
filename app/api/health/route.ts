import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "pagefix-ai",
    timestamp: new Date().toISOString(),
  });
}

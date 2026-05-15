import { NextResponse } from "next/server";
import { pingTwelveData } from "@/lib/market-data";

export async function GET() {
  const twelveData = await pingTwelveData();

  return NextResponse.json({
    status: twelveData.ok ? "ok" : "degraded",
    services: {
      twelveData,
    },
    timestamp: new Date().toISOString(),
  });
}

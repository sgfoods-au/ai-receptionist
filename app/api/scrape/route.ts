import { NextResponse } from "next/server";
import { scrapeBusinessInfo } from "@/lib/scrape/extract";

export async function POST(request: Request) {
  const { url } = (await request.json()) as { url?: string };

  if (!url) {
    return NextResponse.json({ error: "url is required." }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "url is not a valid URL." }, { status: 400 });
  }

  try {
    const info = await scrapeBusinessInfo(url);
    return NextResponse.json(info);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to scrape website." },
      { status: 502 }
    );
  }
}

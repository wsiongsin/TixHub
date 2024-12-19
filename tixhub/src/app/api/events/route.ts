import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const geoPoint = searchParams.get("geoPoint");

  const API_KEY = process.env.TICKETMASTER_API_KEY;
  const baseUrl = "https://app.ticketmaster.com/discovery/v2/events.json";

  try {
    const response = await fetch(
      `${baseUrl}?apikey=${API_KEY}&size=5${
        geoPoint ? `&geoPoint=${geoPoint}` : ""
      }`
    );
    const data = await response.json();

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ status: 500 });
  }
}

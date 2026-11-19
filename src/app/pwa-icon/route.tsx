import { ImageResponse } from "next/og";

// The existing Drivio lightning mark, rendered as an installation icon.
export function GET(request: Request) {
  const size = new URL(request.url).searchParams.get("size") === "192" ? 192 : 512;
  return new ImageResponse(<div style={{ width: "100%", height: "100%", background: "#111214", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width={size * .46} height={size * .54} viewBox="0 0 28 32" fill="#e7b58b"><path d="M10.5 1.5h15L19 13H8L10.5 1.5Z" /><path d="M8.5 15h11L10 30.5H0L8.5 15Z" /></svg></div>, { width: size, height: size, headers: { "Cache-Control": "public, max-age=86400" } });
}

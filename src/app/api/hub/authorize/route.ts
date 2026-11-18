import { readHubBody } from "@/lib/hub-body";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser, SESSION_COOKIE } from "@/lib/auth";
import { readConsentIntent, authorizeHub } from "@/lib/hub-authorization";
import { hubJson } from "@/lib/hub";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return hubJson(
      {
        error: { code: "UNAUTHORIZED", message: "Reconnectez-vous à Drivio." },
      },
      401,
    );
  if (
    request.headers.get("origin") !==
    new URL(process.env.NEXT_PUBLIC_APP_URL || request.url).origin
  )
    return hubJson(
      { error: { code: "FORBIDDEN", message: "Origine refusée." } },
      403,
    );
  try {
    const raw = await readHubBody(request, 65536);
    const form = await new Response(raw, {
        headers: { "content-type": request.headers.get("content-type") || "" },
      }).formData(),
      cookie = (await cookies()).get(SESSION_COOKIE)?.value || "";
    const intent = readConsentIntent(
      String(form.get("intent") || ""),
      user.id,
      cookie,
    );
    let target;
    if (form.get("decision") === "deny") {
      target = new URL(intent.redirectUri);
      target.searchParams.set("error", "access_denied");
      target.searchParams.set("state", intent.state);
    } else if (form.get("decision") === "allow")
      target = await authorizeHub(
        intent,
        user.id,
        form.getAll("vehicle").map(String),
      );
    else throw new Error();
    const response = NextResponse.redirect(target, 303);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch {
    const response = NextResponse.redirect(
      new URL("/hub/authorize", process.env.NEXT_PUBLIC_APP_URL || request.url),
      303,
    );
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}

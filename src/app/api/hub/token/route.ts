import { readHubBody } from "@/lib/hub-body";
import {
  exchangeHubCode,
  HubAuthorizationError,
} from "@/lib/hub-authorization";
import { hubJson } from "@/lib/hub";
export async function POST(request: Request) {
  try {
    const raw = await readHubBody(request, 4096);
    const payload = await exchangeHubCode(JSON.parse(raw));
    return hubJson(payload);
  } catch (error) {
    return hubJson(
      {
        error: {
          code:
            error instanceof HubAuthorizationError
              ? error.code
              : "INVALID_REQUEST",
          message: "Autorisation Drivio invalide. Relancez la connexion.",
        },
      },
      error instanceof HubAuthorizationError ? error.status : 400,
    );
  }
}

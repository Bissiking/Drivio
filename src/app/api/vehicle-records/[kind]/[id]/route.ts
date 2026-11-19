import { withVehicleWrite } from "@/lib/vehicle-access";
import { NextRequest, NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/api";
import { deleteRecord, findRecord, persistRecord, recordKind } from "@/lib/vehicle-records";
type Context = { params: Promise<{ kind: string; id: string }> };
export async function PATCH(request: NextRequest, context: Context) { return mutate(request, context, false); }
export async function DELETE(request: NextRequest, context: Context) { return mutate(request, context, true); }
async function mutate(request: NextRequest, context: Context, remove: boolean) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const params = await context.params, kind = recordKind.parse(params.kind);
    const record = await findRecord(kind, params.id, user.id);
    if (!record) return NextResponse.json({ error: "Élément introuvable." }, { status: 404 });
    const body = remove ? null : { ...await request.json(), vehicleId: record.vehicleId };
    await withVehicleWrite(user.id, record.vehicleId, "COMPLETE", async tx => {
      if (remove) await deleteRecord(kind, record.id, tx);
      else await persistRecord(kind, body, record.id, tx);
    });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}

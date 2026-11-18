import { requireVehicleAccess } from "@/lib/vehicle-access";
// src/app/api/expenses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/api";
import { db } from "@/lib/db";
import { expenseSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const data = expenseSchema.parse(await request.json());
    await requireVehicleAccess(user.id, data.vehicleId, "SIMPLE", true);
    const expense = await db.expense.create({ data });
    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

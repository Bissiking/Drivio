// src/app/api/expenses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { apiError, apiUser, ownedVehicle } from "@/lib/api";
import { db } from "@/lib/db";
import { expenseSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const data = expenseSchema.parse(await request.json());
    if (!(await ownedVehicle(user.id, data.vehicleId))) return NextResponse.json({ error: "Véhicule introuvable." }, { status: 404 });
    const expense = await db.expense.create({ data });
    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

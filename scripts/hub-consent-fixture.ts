// Recette locale isolée : aucun compte ou garage existant n'est utilisé.
import { writeFile } from "node:fs/promises";
import { testDatabase } from "../src/test/database";
import { createSessionToken } from "../src/lib/auth";
if (process.env.NODE_ENV === "production" || !process.env.HUB_FIXTURE_OUTPUT)
  throw new Error("Local fixture only");
async function main() {
  const fixture = await testDatabase();
  try {
    await fixture.client.user.createMany({
      data: [
        { id: "qa-owner", kyrosSubject: "qa-owner", name: "Camille" },
        { id: "qa-other", kyrosSubject: "qa-other", name: "Autre compte" },
      ],
    });
    for (const [id, userId, model, isPrimary] of [
      ["car-a", "qa-owner", "Clio", true],
      ["car-b", "qa-owner", "208", false],
      ["foreign", "qa-other", "Privé", true],
    ] as const) {
      await fixture.client.vehicle.create({
        data: {
          id,
          userId,
          brand: id === "car-b" ? "Peugeot" : "Renault",
          model,
          trim: "Essence",
          year: 2022,
          purchaseDate: new Date("2025-01-01"),
          purchaseMileage: 42000,
          isPrimary,
        },
      });
    }
    const sessions: Record<string, string> = {};
    for (const userId of ["qa-owner", "qa-other"])
      sessions[userId] = await createSessionToken({
        userId,
        subject: userId,
        refreshToken: "fixture-only",
        accessExpiresAt: Date.now() + 3600000,
        refreshExpiresAt: Date.now() + 3600000,
      });
    await writeFile(
      process.env.HUB_FIXTURE_OUTPUT!,
      JSON.stringify({ directory: fixture.directory, sessions }),
      { mode: 0o600 },
    );
  } finally {
    await fixture.client.$disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

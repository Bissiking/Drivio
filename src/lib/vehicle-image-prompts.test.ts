// src/lib/vehicle-image-prompts.test.ts
import { describe, expect, it } from "vitest";
import { buildVehicleImagePrompt } from "./vehicle-image-prompts";

describe("demandes d’images véhicule", () => {
  it("réunit l’identité et tous les choix visuels dans le prompt", () => {
    const prompt = buildVehicleImagePrompt(
      { brand: "CUPRA", model: "Formentor", trim: "V", powertrain: "1.5 TSI 150 DSG7", year: 2024 },
      { color: "Cuivre", bodyStyle: "SUV compact", angle: "Trois-quarts avant", scene: "Parking en béton", lighting: "Heure bleue", weather: "Sol humide", imageStyle: "Éditorial premium", aspectRatio: "paysage 3:2", details: "Jantes noires" },
    );
    expect(prompt).toContain("2024 CUPRA Formentor");
    expect(prompt).toContain("1.5 TSI 150 DSG7");
    expect(prompt).toContain("Cuivre");
    expect(prompt).toContain("Jantes noires");
    expect(prompt).toContain("sans filigrane");
  });
});

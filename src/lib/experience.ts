import { z } from "zod";

export const experienceSchema = z.object({
  homePage: z.enum(["auto", "dashboard", "add"]),
  interfaceStyle: z.enum(["classic", "horizon"]),
}).strict();
export type ExperiencePreferences = z.infer<typeof experienceSchema>;
export function homeDestination(homePage: string, installed: boolean) {
  return homePage === "add" || (homePage === "auto" && installed) ? "/ajouter" : "/dashboard";
}

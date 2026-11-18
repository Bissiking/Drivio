import { z } from "zod";
export const themeSchema = z.object({ mode: z.enum(["dark", "light", "auto"]), palette: z.enum(["copper", "slate"]) });
export const THEME_COOKIE = "drivio_theme";
export function readTheme(value?: string) {
  const [mode, palette] = (value ?? "").split(":");
  return themeSchema.safeParse({ mode, palette }).data ?? { mode: "dark" as const, palette: "copper" as const };
}

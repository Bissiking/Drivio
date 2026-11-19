import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/", name: "Drivio", short_name: "Drivio", lang: "fr",
    description: "Votre registre automobile, du trajet au prochain entretien.",
    start_url: "/", scope: "/", display: "standalone", background_color: "#111214", theme_color: "#141518",
    icons: [
      { src: "/pwa-icon?size=192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon?size=512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

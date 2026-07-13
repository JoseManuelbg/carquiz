import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Privado o sin valor para buscadores.
      disallow: ["/admin", "/api", "/perfil", "/amigos", "/login", "/auth"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

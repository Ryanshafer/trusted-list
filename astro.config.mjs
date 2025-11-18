import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

/**
 * site/base defaults match the repo slug so local builds work without env vars.
 * The deploy workflow sets ASTRO_SITE + ASTRO_BASE automatically depending on
 * whether you're pushing to the root gh-pages build or a versioned subfolder.
 * If you deploy somewhere else (e.g. Vercel, custom domain), update these
 * defaults or create an .env file with ASTRO_SITE/ASTRO_BASE overrides.
 * * https://your-username.github.io/<desired-url>/
 */
const SITE_URL =
  process.env.ASTRO_SITE ?? "https://ryanshafer.github.io/trusted-list/";
const BASE_PATH = process.env.ASTRO_BASE ?? "/trusted-list/";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        "lucide-react",
        "clsx",
        "tailwind-merge",
        "class-variance-authority",
        "@radix-ui/react-slot",
      ],
    },
  },
  ssr: {
    noExternal: [
      "lucide-react",
      "clsx",
      "tailwind-merge",
      "class-variance-authority",
      "@radix-ui/react-slot",
    ],
  },
  integrations: [react()],
  site: SITE_URL,
  base: BASE_PATH,
  output: "static",
});

# Proto Template Starter

A reusable Astro + React prototype scaffold that keeps all the shared infrastructure (Tailwind, shadcn/ui primitives, layout, tokens, GitHub Pages deploy) while leaving the feature surface up to you.

## What's inside

- **Astro + React** with client directives enabled so you can mix Astro layouts and React feature shells freely.
- **Tailwind v4 preview + custom tokens** defined in `src/styles/global.css` (`text-display-lg`, `surface-card`, etc.) for consistent typography, spacing, and color semantics.
- **shadcn/ui primitives** pre-installed under `src/components/ui` so you can drop in buttons, forms, navigation, and dialogs without extra setup. Add whatever UI you like.
- **BaseLayout** (`src/layouts/BaseLayout.astro`) that wires up the site shell, header, and footer toggles.
- **GitHub Actions deploy** (`.github/workflows/deploy.yml`) that builds the site and ships it to GitHub Pages.

### Bundled shadcn/ui components

The following primitives are already generated and ready to import from `src/components/ui`:

`button`, `card`, `dialog`, `dropdown-menu`, `label`, `select`, `textarea`, `input`, `badge`, `checkbox`, `radio-group`, `switch`, `slider`, `tabs`, `tooltip`, `popover`, `sheet`, `avatar`, `breadcrumb`, `navigation-menu`.

Need another primitive? Run `npx shadcn@latest add <component>` and it will land alongside the others.

## Setup

1. Install dependencies: `npm install`
2. Configure `astro.config.mjs` to match your GitHub account/URL (or drop an `.env` with `ASTRO_SITE`/`ASTRO_BASE` if you’re targeting something else).
3. Add a custom shadcn/ui theme into the theme block in `styles/global.css`.
4. Start the dev server: `npm run dev`
5. Open `http://localhost:4321` or whatever localhost url provided by astro to see the placeholder page.

## Build your prototype

- Make sure your AI of choice reads `agents.md` to guide it
- Replace the placeholder section in `src/pages/index.astro` with your own AppShell/entry point. Add `client:load`, `client:visible`, etc. as needed.
- Organize domain logic inside `src/features/<feature>/` with `components/` + `hooks/` folders, then export feature-level entry points via lightweight barrel files.
- Keep shared UI primitives inside `src/components` (remember not to modify anything under `src/components/ui` so shadcn updates remain painless).
- Store any mock JSON that powers your prototype inside the root-level `data/` directory so it mirrors the shape of your eventual API responses.
- When UI comes from Figma, fetch the referenced nodes via the Figma MCP command before coding so you can mirror spacing, typography, and icon choices accurately.
- Import `data/figma-tailwind-variables.json` into Figma Variables so spacing + border radii align with the Tailwind utilities baked into this template.

## Theme swapping

`src/styles/global.css` has a **Theme Drop Zone** at the top of the file. To switch palettes:

1. Copy the theme snippet (`:root`, `.dark`, `@theme inline`) from the shadcn/ui theming tool: `https://tweakcn.com/editor/theme`
2. Replace everything between the `THEME DROP ZONE` start/end comments with that snippet.
3. Update the Google Fonts import at the top of the file if the new theme uses a different family or weight set.
4. The rest of the file contains “Template Extensions” below the drop zone. They add responsive typography, spacing helpers, and utilities—leave them alone and they’ll automatically adapt to the new tokens.

## Styling & interaction guidelines

- Prefer the semantic Tailwind utilities defined in `src/styles/global.css` (`text-display-lg`, `text-ink-muted`, `px-page`, etc.) over raw pixel values. Add a new token if the design calls for values outside the scale.
- Use shadcn component variants instead of stacking extra classes on primitives like `<Button>` or `<Label>` unless you are explicitly overriding them.
- Default pages should render through `BaseLayout`. Only hide the header/footer if a design explicitly needs a blank canvas.
- Map icons from Figma to the Lucide icon library that ships with this repo.
- Clean up timers, intervals, or subscriptions inside React effects on unmount, and wire Radix `DialogClose` elements to every cancel/escape action so dialogs remain accessible.

## Configuration & deployment

- Update `site` and `base` inside `astro.config.mjs` to match your GitHub Pages URL (defaults mirror this repo’s slug). The deploy workflow will override them via `ASTRO_SITE`/`ASTRO_BASE` when needed, so only change the defaults if your production host lives elsewhere.
- If you change repository names, branches, or hosting targets, tweak `.github/workflows/deploy.yml` accordingly so CI continues to publish on every push to `main`.
- Run `npm run build` before committing major layout or routing changes to make sure Astro + Vite compilation still succeeds. Use `npm run preview` to inspect the production build locally.
- GitHub setup checklist (one-time per repo):
  - `Settings → Actions → General → Workflow permissions`: switch to **Read and write permissions** so the workflow can push to `gh-pages`.
  - `Settings → Pages`: select **GitHub Actions** as the source (or choose “Deploy from branch → gh-pages / root” if you prefer the legacy flow).
  - Confirm Pages is enabled so the `pages-build-deployment` workflow can publish the artifacts uploaded by our `Deploy Astro site to gh-pages` job.

### Versioned GitHub Pages deploys

The workflow supports publishing multiple prototypes inside the same `gh-pages` branch:

1. Push to `main` (or trigger the workflow manually) to publish the latest build at `https://<user>.github.io/<repo>/`.
2. To publish into a subfolder (e.g. `/v2/`, `/alt-layout/`), run the workflow manually from the **Actions** tab and set the optional `targetFolder` input (example: `v2`). Leaving it blank publishes to the root. The workflow adjusts `ASTRO_SITE`/`ASTRO_BASE` automatically and creates `gh-pages/<folder>/`.
3. We recommend using git branches to create variants. In Actions, click the **Run workflow** button, choose the branch to deploy, and enter a folder name. The prototype build will be live at `https://<user>.github.io/<repo>/<folder-name>`.

## Commands

| Command | Action |
| --- | --- |
| `npm run dev` | Start the local dev server at `localhost:4321` |
| `npm run build` | Build the static site into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint --if-present` | (Optional) Run any configured lints |
| `npm test --if-present` | (Optional) Run tests if you add them |

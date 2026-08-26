# AGENTS.md - Agent Guidelines for Startpage Project

This file provides guidelines for agentic coding agents operating in this repository.

## Project Overview

This is a SvelteKit-based browser startpage with keyboard navigation, user-defined
tabs, and a retro window UI aesthetic. All content comes from a JSON config read at
request time from `~/.config/startpage/config.json` (override the path with the
`STARTPAGE_CONFIG` env var); nothing user-specific is committed to the repo. The
repo is public — keep it that way by never committing personal links, hostnames or
paths.

## Build/Lint/Test Commands

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Type Checking

```bash
# Run Svelte type checking (single run)
npm run check

# Run type checking in watch mode
npm run check:watch
```

### Formatting

```bash
# Format all files with Prettier
npm run format
```

### Linting

```bash
# Check linting (Prettier + ESLint)
npm run lint

# Note: This project uses ESLint with TypeScript support
```

### Running a Single Test

This project does not currently have a test suite configured. If tests are added in the future:

```bash
# Run a specific test file (if using Vitest/Jest)
npm run test -- <test-file-path>

# Or with specific test name pattern
npm run test -- --grep "<test-name-pattern>"
```

## Code Style Guidelines

### General Principles

- Follow the existing code patterns in the repository
- Keep code readable and maintainable
- Use meaningful variable and function names
- Add comments for complex logic

### TypeScript

- Use TypeScript for all new code
- Enable `strict` mode in tsconfig.json
- Define proper types for function parameters and return values
- Use interface definitions for complex data structures

```typescript
// Good
interface QuickAccessItem {
	url: string;
	shortcut: string;
	name: string;
}

// Good - explicit return type
function buildShortcutMap(rows: Section[][]): Map<string, string> {
	// ...
}
```

### Svelte 5

This project uses Svelte 5 (runes mode). Key patterns:

- Use `$state()` for reactive state
- Use `$derived()` for derived values
- Use `$effect()` for side effects
- Use event handlers like `onclick` instead of `on:click`

```svelte
<!-- Svelte 5 syntax -->
<script>
	let count = $state(0);
	let doubled = $derived(count * 2);

	function increment() {
		count += 1;
	}
</script>

<button onclick={increment}>{count} x 2 = {doubled}</button>
```

Note: The existing codebase uses a mix of Svelte 4 and 5 patterns. New code should prefer Svelte 5 runes syntax when possible.

### Imports

- Use absolute imports with `$lib` alias for internal modules
- Group imports logically (external, internal)

```typescript
// External imports
import { onMount } from 'svelte';

// Internal imports
import type { Section, StartpageConfig } from '$lib/types';
```

### Formatting (Prettier)

The project uses Prettier with these settings (from `.prettierrc`):

- Use tabs for indentation
- Single quotes for strings
- No trailing commas
- Print width: 100 characters
- Use `prettier-plugin-svelte` for `.svelte` files

```bash
# Format before committing
npm run format
```

### Naming Conventions

- **Variables/functions**: camelCase (`currentTabIndex`, `buildShortcutMap`)
- **Constants**: camelCase or SCREAMING_SNAKE_CASE depending on usage
- **Components/Classes**: PascalCase (for Svelte components)
- **Files**: kebab-case for general files, PascalCase for Svelte components

### CSS/Styling

- Use scoped styles in Svelte components
- Prefer CSS custom properties for theming
- Inside `.scene`, size everything in `em` or `%` — see Layout Invariants below.
  Viewport units and `rem` break the "window scales as one unit" property.

```css
/* Example from +page.svelte: the em is a fraction of the scene's own width */
--scene-width: min(1000px, 95vw, calc(95vh * 1000 / 610));
font-size: calc(var(--scene-width) / 62.5);
```

### Error Handling

- Use try/catch for async operations
- Handle keyboard events gracefully (e.g., prevent default when needed)
- Clean up event listeners in `onDestroy` / cleanup functions

```typescript
// Good - cleanup in onMount return
onMount(() => {
	window.addEventListener('keydown', handleKey);

	return () => {
		window.removeEventListener('keydown', handleKey);
		clearInterval(interval);
	};
});
```

### Keyboard Navigation

- Handle single-key shortcuts (lowercase for main, uppercase variants for alternatives)
- Use `e.key` for keyboard event handling
- Consider key conflicts with browser defaults

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   └── ConfigEditor.svelte  # In-page settings window
│   ├── default-config.json      # Written on first run
│   ├── server/config.ts         # Read/write the user's config.json
│   └── types.ts                 # Config shape + tab → 2x2 grid mapping
├── routes/
│   ├── +layout.svelte           # Layout component
│   ├── +layout.js               # Layout load function
│   ├── +page.svelte             # The startpage: layout, keybinds, styling
│   ├── +page.server.ts          # Loads and resolves the config
│   └── api/
│       ├── config/+server.ts    # GET/PUT the config
│       └── images/              # Upload and serve user images
├── app.html                     # HTML template
└── app.d.ts                     # TypeScript declarations
static/
├── background.png     # Default wallpaper
├── window-content.png # Default sidebar photo
└── fonts/             # VT323 and JetBrains Mono Nerd Font (only the faces used)
```

## Configuration

### Adding New Links

Links are user data, not code. They live in the user's `config.json` and are edited
through the settings window or by hand. `src/lib/default-config.json` is the sample
written on first run — keep it generic (no personal links).

```json
{
	"title": "New Section",
	"icon": "🚀",
	"items": [{ "url": "https://example.com", "shortcut": "x", "name": "Example Link" }]
}
```

### Keyboard Shortcuts

- `Tab` / `Shift`+`Tab`: cycle through tabs (forward/backward)
- Any other key: navigate to the URL that claims it in the current tab
- Shortcuts are case-sensitive and only need to be unique within a tab. Keep tab
  cycling off the printable keys so users can bind all of them.
- Duplicates are not an error: the first link with a key wins, the others render
  without one, and the settings window flags the clash.

## Linting Configuration

The project uses ESLint with:

- `@eslint/js` - JavaScript recommended rules
- `typescript-eslint` - TypeScript support
- `eslint-plugin-svelte` - Svelte support
- `eslint-config-prettier` - Disable conflicting Prettier rules

Run linting:

```bash
npm run lint
```

## Common Tasks

### Adding a New Tab

Use the settings window, or add an entry to `tabs` in the user's `config.json`.
Each tab holds up to three sections; Quick Access always fills the fourth box.

### Modifying the Background

Defaults are `static/background.png` (wallpaper) and `static/window-content.png`
(sidebar). Users override both from Settings → Customization, which stores the
upload in `~/.config/startpage/images/`. The window is laid out for a 1000x610
aspect ratio.

### Never Key an `{#each}` on User Data

`{#each items as item (item.shortcut)}` looks harmless and is a landmine: Svelte
throws on duplicate keys, and the resulting error takes down the whole page --
including the settings window, which is the only way a non-technical user could
fix their config. Two links sharing a shortcut, two links with no shortcut, or
two tabs with the same title all used to do exactly that. Key on the index, or
do not key at all, unless the field is genuinely guaranteed unique.

### Layout Invariants

Two rules keep the window from overflowing, and both are easy to break:

1. **Everything inside `.scene` is sized in `em` or `%`.** The scene's font size is
   a fixed fraction of its own width, so the window scales as a single unit and
   browser zoom never reflows it. Introducing `rem`, `vw`, `vmin` or raw `px` sizes
   inside the scene reintroduces the zoom-dependent overflow bug.
2. **Section lists are wrapping flex columns** (`flex-flow: column wrap`), so a long
   list continues in a new column inside the same box. `fitLists()` in
   `+page.svelte` then shrinks a list that still does not fit; it runs after render,
   on resize, and once the webfonts have loaded.

### Regenerating the README Screenshot

`docs/screenshot.jpg` is the default config rendered by a headless browser, so
it has to be retaken whenever `src/lib/default-config.json` or the layout
changes. Build, serve the build against a throwaway config so the app writes the
default one, then capture with Playwright:

```js
const ctx = await browser.newContext({
	viewport: { width: 1400, height: 860 },
	deviceScaleFactor: 2,
	locale: 'en-US',
	timezoneId: 'America/Sao_Paulo'
});
await ctx.clock.setFixedTime(new Date('2026-08-26T09:41:03-03:00'));
```

The fixed clock keeps the title bar from showing whatever time the machine
happened to be at. Keep the result around 2800px wide at JPEG quality 90 -- the
shot is meant to be HD, not downscaled.

### Changing the Theme/Colors

Edit CSS variables in `src/routes/+page.svelte` `<style>` block.

## Additional Resources

- [Svelte 5 Docs](https://svelte.dev/docs/svelte)
- [SvelteKit Docs](https://kit.svelte.dev/docs/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Prettier Docs](https://prettier.io/docs/)
- [ESLint Docs](https://eslint.org/docs/)

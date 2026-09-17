---
name: custom-component-creator
description: Creates new custom UI components (inputs, forms, cards, modals, tables, etc.) that match the conventions already used in the project. Locates the project's custom components directory, detects existing category subfolders to file the new component under the right one (or proposes a new category if none fits), infers file/folder naming, casing, prop/variable naming, export style, and styling approach from existing components and any project guides (README, CONTRIBUTING, .cursorrules, CLAUDE.md, eslint/prettier config), then generates the component following those conventions with only the minimal JSDoc actually needed. Use this whenever the user asks to create, scaffold, or add a new component, especially in a React/Next.js/TypeScript codebase with shadcn/ui or a similar component library, even if they don't explicitly say "component creator."
---

# Custom Component Creator

Purpose: scaffold a new custom UI component that looks like it was written by whoever wrote the rest of the codebase — right folder, right name, right conventions — instead of a generic boilerplate component.

## Workflow

### 1. Find the custom components directory

Search, in order, for the first match:

- Common paths: `src/components/`, `components/`, `app/components/`, `src/shared/components/`, `src/ui/`, etc
- Check `tsconfig.json` / `jsconfig.json` `paths` for an alias like `@/components/*` and resolve it to the real folder
- If shadcn/ui is present (`components/ui/` with a `components.json` at the project root), treat `components/ui/` as reserved for shadcn primitives, not custom components — the actual custom-components home is usually a sibling folder (e.g. `components/custom/`, `components/shared/`, or `components/` outside `ui/`)
- If nothing is found, ask the user where components should live rather than guessing

### 2. Detect category subfolders

List the immediate subfolders of the components directory found in step 1.

- If subfolders match a general UI category (`inputs`, `forms`, `cards`, `tables`, `modals`, `layout`, `buttons`, etc.), match the requested component's type to the closest one and place it there
- If a subfolder's name doesn't obviously map to a category, open a file inside it to see what it actually groups — naming isn't always literal
- If nothing matches, don't force it into the wrong folder: either place it at the top level of the components directory (if most components live flat there) or propose creating a new category folder, matching the naming style of the existing ones (case, singular/plural)

### 3. Infer conventions from what's already there

Before writing anything, open 2–3 existing components (ideally from the same category) and note:

- **File/folder naming**: `PascalCase.tsx` vs `kebab-case.tsx`, one file per component vs a folder per component (`Button/index.tsx`, `Button/Button.tsx`, co-located `Button.styles.ts` / `Button.types.ts`)
- **Export style**: default export vs named export
- **Prop typing**: `interface ComponentNameProps` vs inline `type Props = {}`, whether props are destructured in the function signature
- **Styling approach**: Tailwind utility classes, `cva`/`class-variance-authority` variants (common with shadcn), CSS modules, or styled-components
- **Component structure**: function declaration vs arrow function, `forwardRef` usage, `"use client"` directive if Next.js App Router

Also check for a `README`, `CONTRIBUTING.md`, `.cursorrules`, `CLAUDE.md`/`AGENTS.md`, or ESLint/Prettier config — these often state naming and structure rules explicitly, and take priority over inferred patterns.

### 4. Generate the component

Follow the conventions found in steps 2–3 exactly — don't default to your own preferred style. If conventions are inconsistent across the codebase, follow the most recent or most common pattern, and flag the inconsistency to the user rather than picking silently.

Write JSDoc only where it adds real value:

- A one-line description above the component if its purpose isn't obvious from the name
- Document a prop only if its meaning, format, or default isn't self-evident from its name and type
- Skip JSDoc entirely on trivial, self-describing props (`className`, `children`, `onClick`)
- Never pad with `@param`/`@returns` boilerplate that just restates the TypeScript types

### 5. Confirm and place

Before writing the file, state in one line: the resolved path, the category it's going into (and why), and the naming pattern being followed — so the user can redirect before the file lands in the wrong place.

import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import type { Kind, ToolkitItem } from "../types.js";

const ENTRY_FILE_BY_KIND: Record<Kind, string[]> = {
  skill: ["SKILL.md", "skill.md"],
  agent: ["AGENT.md", "agent.md"],
};

/**
 * Resolve the toolkit repo root, in priority order:
 *   1. explicit --repo flag
 *   2. TOOLKIT_HOME env var
 *   3. walking up from cwd looking for a folder containing both skills/ and agents/
 *   4. ~/.ai-toolkit
 */
export async function resolveToolkitRoot(explicit?: string): Promise<string> {
  const candidates: string[] = [];
  if (explicit) candidates.push(path.resolve(explicit));
  if (process.env.TOOLKIT_HOME) candidates.push(path.resolve(process.env.TOOLKIT_HOME));

  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    candidates.push(dir);
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  candidates.push(path.join(os.homedir(), ".ai-toolkit"));

  for (const c of candidates) {
    if ((await fs.pathExists(path.join(c, "skills"))) || (await fs.pathExists(path.join(c, "agents")))) {
      return c;
    }
  }

  throw new Error(
    "Could not find an ai-toolkit repo (a folder with skills/ and/or agents/). " +
      "Pass --repo <path>, set TOOLKIT_HOME, or run this from inside the toolkit repo."
  );
}

async function findEntryFile(dir: string, kind: Kind): Promise<string | null> {
  for (const candidate of ENTRY_FILE_BY_KIND[kind]) {
    const full = path.join(dir, candidate);
    if (await fs.pathExists(full)) return candidate;
  }
  return null;
}

export async function listItems(toolkitRoot: string, kind: Kind): Promise<ToolkitItem[]> {
  const dirName = kind === "skill" ? "skills" : "agents";
  const base = path.join(toolkitRoot, dirName);
  if (!(await fs.pathExists(base))) return [];

  const entries = await fs.readdir(base, { withFileTypes: true });
  const items: ToolkitItem[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const sourceDir = path.join(base, entry.name);
    const entryFile = await findEntryFile(sourceDir, kind);
    items.push({ kind, name: entry.name, sourceDir, entryFile });
  }

  return items.sort((a, b) => a.name.localeCompare(b.name));
}

export async function listAllItems(toolkitRoot: string): Promise<ToolkitItem[]> {
  const [skills, agents] = await Promise.all([
    listItems(toolkitRoot, "skill"),
    listItems(toolkitRoot, "agent"),
  ]);
  return [...skills, ...agents];
}

export async function findItem(
  toolkitRoot: string,
  kind: Kind,
  name: string
): Promise<ToolkitItem | null> {
  const items = await listItems(toolkitRoot, kind);
  return items.find((i) => i.name === name) ?? null;
}

import fs from "fs-extra";
import path from "node:path";
import type { Adapter, InstallOptions, InstallResult, ToolkitItem } from "../types.js";

/**
 * OpenCode conventions:
 *   .opencode/skills/<name>/SKILL.md   (folder per skill, same shape as Claude Code)
 *   .opencode/agents/<name>.md         (single markdown file per agent)
 *
 * (Global/user-level equivalents live under ~/.config/opencode/{skills,agents}/ -
 *  not handled here since this CLI targets a single project at a time.)
 */
export const openCodeAdapter: Adapter = {
  id: "opencode",
  label: "OpenCode",

  supports: () => true,

  targetDir: (projectRoot, kind, name) => {
    if (kind === "skill") return path.join(projectRoot, ".opencode", "skills", name);
    return path.join(projectRoot, ".opencode", "agents");
  },

  async install(item: ToolkitItem, opts: InstallOptions): Promise<InstallResult> {
    const written: string[] = [];

    if (item.kind === "skill") {
      const target = openCodeAdapter.targetDir(opts.projectRoot, "skill", item.name);
      await guardOverwrite(target, opts.force);
      await fs.copy(item.sourceDir, target, { overwrite: opts.force });
      written.push(target);
      return { writtenPaths: written };
    }

    const agentsDir = openCodeAdapter.targetDir(opts.projectRoot, "agent", item.name);
    await fs.ensureDir(agentsDir);
    const targetFile = path.join(agentsDir, `${item.name}.md`);
    await guardOverwrite(targetFile, opts.force);

    const entrySource = item.entryFile ? path.join(item.sourceDir, item.entryFile) : null;
    if (!entrySource) {
      throw new Error(`Agent "${item.name}" has no AGENT.md/agent.md to install.`);
    }
    await fs.copy(entrySource, targetFile, { overwrite: opts.force });
    written.push(targetFile);

    return { writtenPaths: written };
  },
};

async function guardOverwrite(target: string, force: boolean): Promise<void> {
  if (force) return;
  if (await fs.pathExists(target)) {
    throw new Error(`"${target}" already exists. Re-run with --force to overwrite.`);
  }
}

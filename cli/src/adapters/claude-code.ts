import fs from "fs-extra";
import path from "node:path";
import type { Adapter, InstallOptions, InstallResult, ToolkitItem } from "../types.js";

/**
 * Claude Code conventions (as of this writing):
 *   .claude/skills/<name>/SKILL.md   (+ any supporting files, copied as a folder)
 *   .claude/agents/<name>.md         (single markdown file, not a folder)
 */
export const claudeCodeAdapter: Adapter = {
  id: "claude-code",
  label: "Claude Code",

  supports: () => true,

  targetDir: (projectRoot, kind, name) => {
    if (kind === "skill") return path.join(projectRoot, ".claude", "skills", name);
    return path.join(projectRoot, ".claude", "agents");
  },

  async install(item: ToolkitItem, opts: InstallOptions): Promise<InstallResult> {
    const written: string[] = [];

    if (item.kind === "skill") {
      const target = claudeCodeAdapter.targetDir(opts.projectRoot, "skill", item.name);
      await guardOverwrite(target, opts.force);
      await fs.copy(item.sourceDir, target, { overwrite: opts.force });
      written.push(target);
      return { writtenPaths: written };
    }

    // agent: single file, source folder's entry file becomes <name>.md
    const agentsDir = claudeCodeAdapter.targetDir(opts.projectRoot, "agent", item.name);
    await fs.ensureDir(agentsDir);
    const targetFile = path.join(agentsDir, `${item.name}.md`);
    await guardOverwrite(targetFile, opts.force);

    const entrySource = item.entryFile
      ? path.join(item.sourceDir, item.entryFile)
      : null;
    if (!entrySource) {
      throw new Error(`Agent "${item.name}" has no AGENT.md/agent.md to install.`);
    }
    await fs.copy(entrySource, targetFile, { overwrite: opts.force });
    written.push(targetFile);

    // copy any other supporting files (scripts, references) alongside, in a subfolder
    const siblings = (await fs.readdir(item.sourceDir)).filter((f) => f !== item.entryFile);
    if (siblings.length > 0) {
      const supportDir = path.join(agentsDir, `${item.name}.assets`);
      await fs.ensureDir(supportDir);
      for (const f of siblings) {
        const dest = path.join(supportDir, f);
        await fs.copy(path.join(item.sourceDir, f), dest, { overwrite: opts.force });
        written.push(dest);
      }
    }

    return { writtenPaths: written };
  },
};

async function guardOverwrite(target: string, force: boolean): Promise<void> {
  if (force) return;
  if (await fs.pathExists(target)) {
    throw new Error(`"${target}" already exists. Re-run with --force to overwrite.`);
  }
}

import chalk from "chalk";
import { Command } from "commander";
import path from "node:path";
import { findItem, resolveToolkitRoot } from "../lib/discover.js";
import { getAdapter, adapterIds } from "../adapters/registry.js";
import type { Kind } from "../types.js";

export function registerInstallCommand(program: Command) {
  program
    .command("install")
    .description("Install a skill or agent from the toolkit into the current project")
    .argument("<kind>", "skill | agent")
    .argument("<name>", "name of the skill/agent (folder name in the toolkit repo)")
    .requiredOption("-t, --target <tool>", `target tool: ${adapterIds.join(" | ")}`)
    .option("-p, --project <path>", "project root to install into", process.cwd())
    .option("-r, --repo <path>", "path to the ai-toolkit repo")
    .option("-f, --force", "overwrite existing files", false)
    .action(
      async (
        kindArg: string,
        name: string,
        opts: { target: string; project: string; repo?: string; force: boolean }
      ) => {
        const kind = normalizeKind(kindArg);
        const toolkitRoot = await resolveToolkitRoot(opts.repo);
        const item = await findItem(toolkitRoot, kind, name);

        if (!item) {
          console.error(chalk.red(`No ${kind} named "${name}" found in ${toolkitRoot}.`));
          console.error(chalk.dim(`Run "toolkit list ${kind}" to see what's available.`));
          process.exitCode = 1;
          return;
        }

        const adapter = getAdapter(opts.target);
        if (!adapter.supports(kind)) {
          console.error(chalk.red(`${adapter.label} does not support installing ${kind}s.`));
          process.exitCode = 1;
          return;
        }

        const projectRoot = path.resolve(opts.project);

        try {
          const result = await adapter.install(item, { projectRoot, force: opts.force });
          console.log(chalk.green(`Installed ${kind} "${name}" for ${adapter.label}:`));
          for (const p of result.writtenPaths) {
            console.log(`  ${chalk.dim("->")} ${path.relative(projectRoot, p)}`);
          }
        } catch (err) {
          console.error(chalk.red((err as Error).message));
          process.exitCode = 1;
        }
      }
    );
}

function normalizeKind(raw: string): Kind {
  const v = raw.toLowerCase();
  if (v === "skill" || v === "skills") return "skill";
  if (v === "agent" || v === "agents") return "agent";
  throw new Error(`Invalid kind "${raw}". Use "skill" or "agent".`);
}

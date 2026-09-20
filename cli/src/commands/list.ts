import chalk from "chalk";
import { Command } from "commander";
import { listAllItems, listItems, resolveToolkitRoot } from "../lib/discover.js";
import { adapterIds } from "../adapters/registry.js";
import type { Kind } from "../types.js";

export function registerListCommand(program: Command) {
  program
    .command("list")
    .description("List available skills and agents in the toolkit repo")
    .argument("[kind]", "skill | agent (omit for both)")
    .option("-r, --repo <path>", "path to the ai-toolkit repo")
    .action(async (kindArg: string | undefined, opts: { repo?: string }) => {
      const root = await resolveToolkitRoot(opts.repo);
      const items = kindArg
        ? await listItems(root, normalizeKind(kindArg), )
        : await listAllItems(root);

      if (items.length === 0) {
        console.log(chalk.yellow("No items found."));
        return;
      }

      console.log(chalk.dim(`Toolkit repo: ${root}\n`));
      for (const item of items) {
        const status = item.entryFile ? chalk.green("ok") : chalk.red("missing entry file");
        console.log(`${chalk.bold(item.kind.padEnd(5))} ${item.name}  ${chalk.dim(`[${status}]`)}`);
      }
      console.log(chalk.dim(`\nTargets: ${adapterIds.join(", ")}`));
    });
}

function normalizeKind(raw: string): Kind {
  const v = raw.toLowerCase();
  if (v === "skill" || v === "skills") return "skill";
  if (v === "agent" || v === "agents") return "agent";
  throw new Error(`Invalid kind "${raw}". Use "skill" or "agent".`);
}

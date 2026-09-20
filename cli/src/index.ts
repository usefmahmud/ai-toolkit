#!/usr/bin/env node
import { Command } from "commander";
import { maybeServeCompletion, registerCompletionCommand } from "./completion.js";
import { registerInstallCommand } from "./commands/install.js";
import { registerListCommand } from "./commands/list.js";

async function main() {
  // Must run before commander touches argv: tabtab talks to us via env vars,
  // not real CLI args, when the shell is asking for completions.
  const servedCompletion = await maybeServeCompletion();
  if (servedCompletion) return;

  const program = new Command();
  program
    .name("toolkit")
    .description("Install skills/agents from your ai-toolkit repo into a project, in whatever folder layout the target tool expects.")
    .version("0.1.0");

  registerListCommand(program);
  registerInstallCommand(program);
  registerCompletionCommand(program);

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});

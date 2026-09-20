import tabtab from "tabtab";
import { Command } from "commander";
import { adapterIds } from "./adapters/registry.js";
import { listItems, resolveToolkitRoot } from "./lib/discover.js";
import type { Kind } from "./types.js";

const CLI_NAME = "toolkit";
const TOP_LEVEL_COMMANDS = ["install", "list", "completion"];
const KINDS: Kind[] = ["skill", "agent"];

/**
 * Called once at process start, before commander parses argv.
 * If the shell is asking us for completions (tabtab sets COMP_* env vars),
 * we answer here and exit — commander never sees the request.
 */
export async function maybeServeCompletion(): Promise<boolean> {
  const env = tabtab.parseEnv(process.env);
  if (!env.complete) return false;

  try {
    await serve(env);
  } catch {
    // Never let a completion request crash the user's shell.
    tabtab.log([]);
  }
  return true;
}

async function serve(env: tabtab.TabtabEnv): Promise<void> {
  // tabtab's env.words is a *count*, not an array, so we derive the word
  // list ourselves from env.line (the full input line typed so far), e.g.
  //   "toolkit install ski"        -> words: ["install"], current partial: "ski"
  //   "toolkit install skill fo"   -> words: ["install", "skill"], current partial: "fo"
  const line = env.line ?? "";
  const endsWithSpace = /\s$/.test(line);
  const allArgs = line.trim().split(/\s+/).filter(Boolean).slice(1); // drop program name
  // If the line ends with a space, the previous word is complete and the
  // user is starting a fresh (empty) word; otherwise the last arg is the
  // in-progress partial the shell will filter by prefix for us.
  const words = endsWithSpace ? allArgs : allArgs.slice(0, -1);
  const prev = words[words.length - 1];

  // Completing a flag value: --target <TAB>
  if (prev === "--target" || prev === "-t") {
    return tabtab.log(adapterIds);
  }

  // Top level: nothing typed yet, or completing the subcommand itself
  if (words.length === 0) {
    return tabtab.log(TOP_LEVEL_COMMANDS);
  }

  const [cmd, ...rest] = words;

  if (cmd === "list") {
    if (rest.length === 0) return tabtab.log(KINDS);
    return tabtab.log([]);
  }

  if (cmd === "install") {
    if (rest.length === 0) {
      return tabtab.log(KINDS);
    }
    if (rest.length === 1) {
      const kind = normalizeKind(rest[0]);
      if (!kind) return tabtab.log([]);
      const root = await resolveToolkitRoot();
      const items = await listItems(root, kind);
      return tabtab.log(items.map((i) => i.name));
    }
    // after <kind> <name>, only flags are left
    return tabtab.log(["--target", "--project", "--repo", "--force"]);
  }

  if (cmd === "completion") {
    return tabtab.log(["install", "uninstall"]);
  }

  return tabtab.log([]);
}

function normalizeKind(raw: string): Kind | null {
  const v = raw.toLowerCase();
  if (v === "skill" || v === "skills") return "skill";
  if (v === "agent" || v === "agents") return "agent";
  return null;
}

export function registerCompletionCommand(program: Command) {
  const completion = program
    .command("completion")
    .description("Manage shell autocompletion for this CLI");

  completion
    .command("install")
    .description("Install autocompletion for your current shell")
    .action(async () => {
      await tabtab.install({ name: CLI_NAME, completer: CLI_NAME });
      console.log(`Autocompletion installed. Restart your shell (or "source" your rc file).`);
    });

  completion
    .command("uninstall")
    .description("Remove autocompletion for this CLI")
    .action(async () => {
      await tabtab.uninstall({ name: CLI_NAME });
      console.log("Autocompletion removed.");
    });
}

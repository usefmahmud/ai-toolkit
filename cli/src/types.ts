export type Kind = "skill" | "agent";

export interface ToolkitItem {
  kind: Kind;
  /** folder / slug name, e.g. "shamela-rag" */
  name: string;
  /** absolute path to the source folder in the toolkit repo */
  sourceDir: string;
  /** primary entry file inside sourceDir, if the adapter cares (SKILL.md, agent.md, ...) */
  entryFile: string | null;
}

export interface InstallOptions {
  /** absolute path to the project the item is being installed into */
  projectRoot: string;
  /** overwrite existing files without prompting */
  force: boolean;
}

export interface InstallResult {
  /** absolute paths written or copied */
  writtenPaths: string[];
}

/**
 * An Adapter knows how a single AI coding tool (Claude Code, OpenCode, ...)
 * expects skills/agents to be laid out inside a *consuming* project, and
 * how to place a ToolkitItem there.
 */
export interface Adapter {
  /** id used on the CLI, e.g. "claude-code" */
  id: string;
  /** human friendly label */
  label: string;
  /** does this adapter support installing this kind of item at all */
  supports: (kind: Kind) => boolean;
  /**
   * Where (relative to projectRoot) this kind of item should live for this tool,
   * e.g. Claude Code skills -> ".claude/skills/<name>/"
   */
  targetDir: (projectRoot: string, kind: Kind, name: string) => string;
  /** perform the actual install (copy + any per-tool transform) */
  install: (item: ToolkitItem, opts: InstallOptions) => Promise<InstallResult>;
}

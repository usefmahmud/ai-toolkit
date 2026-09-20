import type { Adapter } from "../types.js";
import { claudeCodeAdapter } from "./claude-code.js";
import { openCodeAdapter } from "./opencode.js";

/**
 * Add a new tool by writing one adapter file and registering it here.
 * Nothing else in the CLI needs to change.
 */
export const adapters: Record<string, Adapter> = {
  [claudeCodeAdapter.id]: claudeCodeAdapter,
  [openCodeAdapter.id]: openCodeAdapter,
};

export const adapterIds = Object.keys(adapters);

export function getAdapter(id: string): Adapter {
  const adapter = adapters[id];
  if (!adapter) {
    throw new Error(`Unknown target "${id}". Known targets: ${adapterIds.join(", ")}`);
  }
  return adapter;
}

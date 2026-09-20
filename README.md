# ai-toolkit

A repo of reusable **skills** and **agents**, plus a small CLI (`toolkit`) that
installs any of them into a project in whatever folder layout the target AI
tool expects (Claude Code, OpenCode, ...).

## Layout

```
ai-toolkit/
├── skills/
│   └── <name>/
│       └── SKILL.md        # or skill.md
├── agents/
│   └── <name>/
│       └── AGENT.md         # or agent.md
└── cli/                     # the toolkit CLI itself
```

Each skill/agent lives in its own folder named after itself. Extra files
(scripts, references) in that folder are treated as supporting assets and
carried along on install where the target tool supports it.

## CLI

```
cd cli
npm install
npm run build
npm link          # makes `toolkit` available globally for local dev
```

### Commands

```
toolkit list [skill|agent]                # see what's available
toolkit install <skill|agent> <name> \
  --target <claude-code|opencode> \
  [--project <path>] [--repo <path>] [--force]
toolkit completion install                # enable tab-completion
toolkit completion uninstall
```

`--repo` is only needed if you're running `toolkit` from outside the
ai-toolkit repo; otherwise it's auto-detected by walking up from `cwd`
(or via a `TOOLKIT_HOME` env var, or `~/.ai-toolkit` as a last resort).

### Adding a new target tool

Add one file in `cli/src/adapters/<tool>.ts` implementing the `Adapter`
interface (where its skills/agents folder lives, how to copy a skill in,
how to copy an agent in), then register it in
`cli/src/adapters/registry.ts`. Nothing else needs to change — `list`,
`install`, and autocompletion all pick it up automatically via
`adapterIds`.

### Autocompletion

`toolkit completion install` registers a completer with your shell
(bash/zsh/fish, via [tabtab](https://www.npmjs.com/package/tabtab)) that:

- completes `install`, `list`, `completion` at the top level
- completes `skill`/`agent` as the first argument to `install`/`list`
- completes real skill/agent **names**, read live from the repo, as the
  second argument to `install`
- completes `--target` values from the registered adapters

Run `toolkit completion uninstall` to remove it.

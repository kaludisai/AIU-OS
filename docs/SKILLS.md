# Six skills you can use immediately

| Command | When to use it | What you get |
| --- | --- | --- |
| `/setup-workspace` | Your first session | A short interview and private current brief |
| `/capture-context` | A useful fact or decision should carry forward | A dated source-linked private note and index |
| `/find-context` | You need the facts or decisions already saved | A file-backed answer with conflicts and unknowns |
| `/plan-one-task` | You have a goal and source files | A saved review draft with constraints and next action |
| `/check-work` | You have an output to evaluate | Met / not met / not verifiable, with evidence |
| `/refine-workflow` | You have real feedback | One accepted change and an observed or pending retest |

In local Claude Code, type the slash command and your request. All six skills are user-invoked; none runs automatically from its description. Codex copies are in .agents/skills; check discovery in your own host. If the command is absent, ask your agent to read its exact SKILL.md and follow it for this task.

## Two memory examples

`/capture-context Remember for this practice project: I prefer preparation steps grouped into the night before and the day of the dinner.`

`/find-context What preparation format did I choose for the practice dinner? Show the source and distinguish it from a proposed menu.`

## Optional local search

```bash
python3 scripts/find_context.py vegetarian
python3 scripts/find_context.py "preparation" --path personal
python3 scripts/find_context.py "budget" --json
```

This is literal text search over Markdown/text files, not semantic search or an AI model. By default it searches brief/, assets/, projects/ and examples/. personal/ is opt-in. It stays inside this workspace, skips symlinks and common secret-like names, uses no network and installs nothing. Those filters do not replace reviewing your own data or host permissions.

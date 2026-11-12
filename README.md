# AIU-OS

Your first practical workspace for Claude Code, built around the **MASTER Framework**:
**Memory, Apps, Skills, Tasks, Evaluation, Refinement.**

Think of an agent's desk: a filing cabinet, computer apps, a notebook, a to-do list, a progress report and coaching. This starter gives those ideas a small, editable home on your computer.

## Six useful skills, ready to edit

| Skill | Use it to | Get |
| --- | --- | --- |
| `/setup-workspace` | Explain your work and current goal | A private working brief |
| `/capture-context` | Save a confirmed fact, preference or decision | A dated note with a source |
| `/find-context` | Recover what you already know or decided | An answer with exact file references |
| `/plan-one-task` | Give the agent one clear job | A saved plan or draft for review |
| `/check-work` | Inspect the result against your requirements | Evidence-backed findings |
| `/refine-workflow` | Teach a reusable lesson from real feedback | A focused edit and retest record |

You also get **three practice workflows** (everyday planning, content creation and development), task/feedback/context templates, and a **local context-search script** that uses Python's standard library. No API key or dashboard installation is needed for the supplied exercises. Agent application/model access is separate.

See [the skill examples](docs/SKILLS.md) and [the practice workflows](examples/README.md).

## Start with one prompt

Open the [install guide](docs/GETTING-STARTED.md#copy-this-prompt), copy the full prompt, and give it to Claude Code or Codex with local file access. Your agent sets up a new folder and starts the personalization interview.

## Manual setup and optional first workflow

1. Download this repository using **Code -> Download ZIP**, or clone it:

   ```bash
   git clone https://github.com/kaludisai/AIU-OS.git
   cd AIU-OS
   ```

2. Open the extracted **AIU-OS folder** as a local Claude Code workspace. Keep the hidden `.claude` and `.agents` folders.
3. Run `/setup-workspace`. It asks a short interview and saves your answers in the gitignored `personal/` folder. You can also keep the fictional dinner example and skip personalization.
4. Ask Claude to read the operating map and identify the current goal, sources and unknowns.
5. Try one task:

   ```text
   /plan-one-task Use the fictional birthday-dinner example. Read brief/now.md and projects/first-task/README.md. Save a review draft in projects/first-task/output.md. Do not buy or book anything.
   ```

6. Run `/check-work` with the saved output path. Review it yourself.
7. If you want a lasting change, run `/refine-workflow`, approve one focused update, and test the affected case again.
8. Start a fresh chat in this folder. Ask it to locate your draft, accepted decisions and next action.

If a skill is missing from the menu, inspect its discovery and ask the agent to read its exact SKILL.md file. A file existing on disk does not prove a host loaded it. This walkthrough targets local Claude Code. Codex entries and the matching AGENTS.md are included; verify discovery in your own version. No hosted/cloud compatibility is promised.

## What's included

| MASTER | Desk object | Files |
| --- | --- | --- |
| Memory | Filing cabinet | Brief, source directory, saved decisions and file map |
| Apps | Computer apps | A connection register; external apps start unconnected |
| Skills | Notebook | Six standalone skills, mirrored for Claude Code and Codex |
| Tasks | To-do list | One fictional practice project and a run template |
| Evaluation | Progress report | A checklist and evidence-based review skill |
| Refinement | Coaching | A feedback template and focused improvement skill |

![The MASTER desk](docs/master-desk.svg)

The kit uses ordinary Markdown files and Python 3 for optional structural checks. No packages, API key, hosted server or dashboard installation are required by the kit. Your agent application and model access are separate.

## Quick structural check

```bash
python3 scripts/check_workspace.py
```

This checks required files, local routes and matching mirrors. It does not certify output quality, privacy of future edits or live app access. Use [the actual-run checklist](CHECK-YOUR-MASTER.md) for that.

## Resources

- [MASTER framework](docs/MASTER.md)
- [Step-by-step setup](docs/GETTING-STARTED.md)
- [Privacy and public/private boundaries](docs/PRIVACY.md)
- [Official Claude memory docs](https://code.claude.com/docs/en/memory)
- [Official Claude skill docs](https://code.claude.com/docs/en/skills)
- [Join the free AI University Discord](https://discord.gg/DUZwXQzfAe)

## Open source

MIT license for this repository's original starter code, documentation and diagram. No personal workspace, credentials, private data, purchased RUBRIC code or licensed presentation-template source is included. The slide deck used to teach the lesson is a separate presentation artifact, not part of this software kit.


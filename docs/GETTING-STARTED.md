# Set up AIU-OS with one prompt

Open Claude Code or Codex with local file access, then paste the prompt below. The agent handles the folder setup and starts a short personalization interview. You need your own existing agent/model access and a way for that agent to download files.

## Copy this prompt

```text
Set up AIU-OS for me from https://github.com/kaludisai/AIU-OS.

Download or clone it into a new, empty AIU-OS folder on my computer. Keep the hidden .claude and .agents folders. Keep my existing workspace and instructions intact; if the destination already exists, ask where to put the new copy.

Read the repository README and docs/GETTING-STARTED.md, then inspect the startup maps and six skills before using them. Use my existing Claude Code or Codex setup. If Python 3 is available, run scripts/check_workspace.py and report the actual result.

Open the new workspace if your tools support it; otherwise tell me its exact path and how to open it. Then follow setup-workspace to personalize it, asking one question at a time and saving my confirmed answers under personal/.

Finish by showing me the workspace path, the skills available in my agent, and one task I can try. Do not publish my files, connect accounts, install extra software, or replace existing work.
```

## After setup

Answer the interview questions you want to answer. Your confirmed answers go in the local `personal/` folder. Start with one task you actually need help with. The agent should tell you where the workspace lives and which skills it can use.

Six included skills: setup-workspace, capture-context, find-context, plan-one-task, check-work and refine-workflow. See [examples and commands](SKILLS.md).

A file check confirms structure, not that a host discovered every skill. If a command is missing, ask your agent to read its exact SKILL.md file and inspect discovery. The project maps and skill copies support Claude Code and Codex; a different host may need its own adapter.

## Manual alternative

Choose **Code > Download ZIP** on [GitHub](https://github.com/kaludisai/AIU-OS), extract it, and open the AIU-OS root folder in your agent. Keep hidden folders. Then ask it to read CLAUDE.md or AGENTS.md and follow `.claude/skills/setup-workspace/SKILL.md` (or the matching `.agents` copy).

## Optional practice

The [three fictional exercises](../examples/README.md) are there if you want them. For the dinner fixture, explicitly choose `brief/now.md` and `projects/first-task/README.md`; for creator or developer work, name the relevant example. No practice walkthrough is required to install the workspace.

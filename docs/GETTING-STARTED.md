# Your first session

Repository: https://github.com/kaludisai/AIU-OS

1. Download ZIP or clone the repository and open its root folder in local Claude Code.
2. Keep the hidden skill folders. Read README.md and the startup map.
3. Use `/setup-workspace` for private personalization, or use the fictional dinner fixture.
4. Ask the agent to state the goal, constraints, source paths and unknowns before drafting.
5. Run `/plan-one-task` with a named brief and project.
6. Run `/check-work` against the saved output. Review it yourself and decide what is accepted.
7. If a reusable correction is needed, use `/refine-workflow` and approve one focused change. Rerun the affected task.
8. In a fresh chat, ask what was saved, what is accepted and what happens next. Check the exact file references.

For the fictional fixture, explicitly name `brief/now.md` and `projects/first-task/README.md`, even after personalization.

If a menu command is missing, ask the agent to read its file in `.claude/skills/` and inspect discovery. Do not assume restart, installation or cloud sync has succeeded merely because a file exists.

---
name: check-work
description: Evaluate an existing output against its named goal, source facts and acceptance criteria.
disable-model-invocation: true
---

# check-work

Ask for the output path and project if ambiguous. Read the output, task brief, relevant sources and actual acceptance criteria. For each criterion, report met, not met or not verifiable with specific evidence. Check factual support, constraints, useful format and missing information. Separate agent suggestions from user-approved decisions. Do not give an arbitrary score or claim a runtime test happened. Propose at most three concrete changes, ordered by effect on the task. Save a review to the selected project or personal/runs/ when requested; do not overwrite accepted work. The user decides acceptance. Evaluation does not automatically change a skill, grant app access or authorize external action.

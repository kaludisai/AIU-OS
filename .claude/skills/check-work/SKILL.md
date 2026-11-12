---
name: check-work
description: Evaluate an existing output against its named goal, source facts and acceptance criteria.
disable-model-invocation: true
---

# check-work

1. Ask for the output path and project if ambiguous.

2. Read the output, task brief, relevant sources and actual acceptance criteria.

3. For each criterion, report met, not met or not verifiable with specific evidence.

4. Check factual support, constraints, useful format and missing information.

5. Separate agent suggestions from user-approved decisions.

6. Do not give an arbitrary score or claim a runtime test happened.

7. Propose at most three concrete changes, ordered by effect on the task.

8. Save a review to the selected project or personal/runs/ when requested; do not overwrite accepted work.

9. The user decides acceptance.

10. Evaluation does not automatically change a skill, grant app access or authorize external action.

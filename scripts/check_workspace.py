"""Offline structural check; not an agent quality or privacy certification."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
required=['README.md','CLAUDE.md','AGENTS.md','brief/now.md','assets/README.md','assets/dinner-notes.md','connections.md','CHECK-YOUR-MASTER.md','templates/run-record.md','templates/feedback.md','projects/first-task/README.md','docs/MASTER.md','docs/PRIVACY.md','docs/GETTING-STARTED.md','LICENSE']
errors=[]
for name in required:
    if not (ROOT/name).is_file(): errors.append('Missing '+name)
if (ROOT/'CLAUDE.md').read_bytes()!=(ROOT/'AGENTS.md').read_bytes(): errors.append('Operating maps differ')
for name in ['setup-workspace','plan-one-task','check-work','refine-workflow']:
    a=ROOT/'.claude/skills'/name/'SKILL.md';b=ROOT/'.agents/skills'/name/'SKILL.md'
    if not a.is_file() or not b.is_file() or a.read_bytes()!=b.read_bytes(): errors.append('Skill mirror mismatch: '+name)
for target in re.findall(r'`([^`]+)`',(ROOT/'CLAUDE.md').read_text()):
    if target.startswith(('personal/','/')): continue
    if not (ROOT/target).exists(): errors.append('Broken map route: '+target)
if errors: raise SystemExit('FAIL\n'+'\n'.join(errors))
print('PASS: required files, map routes, operating-map equality and four skill mirrors. Runtime and output quality require an actual session.')

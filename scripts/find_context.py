"""Local literal context search. Python 3 standard library; no network or telemetry."""
from pathlib import Path
import argparse,json,re,sys
ROOT=Path(__file__).resolve().parents[1]
DEFAULTS=['brief','assets','projects','examples']
DENY={'private','secrets','credentials','.git','.claude','.agents','node_modules','__pycache__'}
SECRET=re.compile(r'(^|[._-])(secret|secrets|credential|credentials|token|tokens|password|passwords|key|keys)([._-]|$)',re.I)
def allowed(path,root):
    try: relative=path.relative_to(root)
    except ValueError: return False
    return not any(p in DENY or p.startswith('.') or SECRET.search(p) for p in relative.parts)
def search(query,scopes,root=ROOT,limit=20):
    root=root.resolve();found=[];seen=set()
    for scope in scopes:
        base=(root/scope).resolve()
        if not allowed(base,root): raise ValueError('Search scope must stay inside the workspace and avoid restricted names.')
        if not base.exists(): continue
        files=[base] if base.is_file() else sorted(base.rglob('*'))
        for p in files:
            # Validate both lexical path and resolved target to prevent symlink escapes.
            if p in seen or not allowed(p,root) or p.is_symlink() or not allowed(p.resolve(),root): continue
            seen.add(p)
            if not p.is_file() or p.suffix.lower() not in ('.md','.txt') or p.stat().st_size>1_000_000: continue
            try: lines=p.read_text(encoding='utf-8').splitlines()
            except (UnicodeError,OSError): continue
            for n,line in enumerate(lines,1):
                if query.casefold() in line.casefold():
                    found.append({'path':p.relative_to(root).as_posix(),'line':n,'text':line[:600]})
                    if len(found)>=limit: return found
    return found

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('query',help='Literal phrase, case insensitive')
    ap.add_argument('--path',action='append',dest='paths',help='Repeat for selected workspace-relative scopes; personal/ is opt-in')
    ap.add_argument('--limit',type=int,default=20)
    ap.add_argument('--json',action='store_true')
    args=ap.parse_args()
    if not args.query.strip(): ap.error('Use a nonempty search phrase.')
    if not 1<=args.limit<=200: ap.error('--limit must be between 1 and 200.')
    try: hits=search(args.query,args.paths or DEFAULTS,limit=args.limit)
    except ValueError as e: ap.error(str(e))
    if args.json: print(json.dumps(hits,indent=2))
    elif hits:
        for hit in hits: print('{path}:{line}: {text}'.format(**hit))
    else: print('No literal matches in the selected files. Try another phrase or scope.')
if __name__=='__main__':main()

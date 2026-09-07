"""Execute only the reviewed repository corpus; never a runtime/user-code sandbox."""
import argparse, ast, hashlib, json, os, pathlib, subprocess, sys, tempfile
ROOT = pathlib.Path(__file__).resolve().parents[2]
RUNNER = '''import contextlib,io,json,resource,sys
resource.setrlimit(resource.RLIMIT_CPU,(2,2))
resource.setrlimit(resource.RLIMIT_FSIZE,(1048576,1048576))
source=sys.stdin.read()
class Bounded(io.StringIO):
 def write(self,s):
  if self.tell()+len(s)>65536: raise RuntimeError("output limit")
  return super().write(s)
buf=Bounded(); error=None
try:
 with contextlib.redirect_stdout(buf): exec(compile(source,"<snippet>","exec"),{})
except BaseException as e: error=type(e).__name__
print(json.dumps({"stdout":buf.getvalue(),"exception":error}))
'''
def execute(source, seed, timeout=3):
    tree=ast.parse(source)
    for node in ast.walk(tree):
        if isinstance(node,(ast.Import,ast.ImportFrom)):
            raise ValueError('Imports are outside the reviewed corpus contract')
        if isinstance(node,ast.Name) and node.id in {'open','exec','eval','compile','__import__','input'}:
            raise ValueError('External effects are outside the corpus contract')
    with tempfile.TemporaryDirectory() as directory:
        result=subprocess.run([sys.executable,'-S','-c',RUNNER],input=source,text=True,capture_output=True,cwd=directory,env={'PATH':os.defpath,'PYTHONHASHSEED':str(seed),'PYTHONIOENCODING':'utf-8'},timeout=timeout,check=True)
        return json.loads(result.stdout)
def generate():
    metadata=json.loads((ROOT/'src/modules/python_output/metadata.json').read_text())
    rows=[]
    for m in metadata:
        source=(ROOT/f"src/modules/python_output/snippets/{m['id']}.py").read_text()
        results=[execute(source,seed) for seed in (1,17,937)]
        if any(r!=results[0] for r in results): raise ValueError(f"Nondeterministic: {m['id']}")
        rows.append({**m,'code':source,**results[0],'sourceSha256':hashlib.sha256(source.encode()).hexdigest()})
    return {'pythonVersion':sys.version.split()[0],'runsPerSnippet':3,'snippets':rows}
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
    target=ROOT/'src/modules/python_output/answers.json'
    result=generate()
    if args.check:
        existing=json.loads(target.read_text())
        assert existing['snippets']==result['snippets'], 'Regenerate answer key with reviewed Python version'
        print(f"Verified {len(result['snippets'])} snippets, 3 isolated executions each")
    else: target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')

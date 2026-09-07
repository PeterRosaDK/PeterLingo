"""Explicit development import of three CC BY-SA 3.0 human vowel recordings.
Requires ffmpeg. The PWA uses only resulting local PCM WAV and mel images.
"""
import hashlib, importlib.util, json, pathlib, subprocess, tempfile, urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[2]
SOURCES=[('human-i','i','Close_front_unrounded_vowel.ogg','Høj fortungevokal med urundede læber. Prøv at holde en i-lyd.'),
         ('human-y','y','Close_front_rounded_vowel.ogg','Høj fortungevokal med rundede læber. Hold tungen som ved i, og rund læberne.'),
         ('human-u','u','Close_back_rounded_vowel.ogg','Høj bagtungevokal med rundede læber. Tungen er længere tilbage end ved i og y.')]
def run():
    spec=importlib.util.spec_from_file_location('generator',ROOT/'tools/phonetics-dataset/generate.py'); module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    rows=[]
    for identifier,ipa,name,cue in SOURCES:
        digest=hashlib.md5(name.encode()).hexdigest()
        url=f'https://upload.wikimedia.org/wikipedia/commons/{digest[0]}/{digest[:2]}/{name}'
        with tempfile.TemporaryDirectory() as temp:
            source=pathlib.Path(temp)/'source.ogg'
            request=urllib.request.Request(url,headers={'User-Agent':'PeterLingo/0.3 (educational offline IPA importer)'})
            with urllib.request.urlopen(request,timeout=30) as response: source.write_bytes(response.read())
            target=ROOT/f'public/assets/phonetics/{identifier}.wav'
            subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(source),'-ac','1','-ar','16000','-c:a','pcm_s16le',str(target)],check=True)
            rows.append(dict(id=identifier,language='da',ipa=ipa,label=ipa,**{'class':'vokal'},tier=1,synthetic=False,
                             cue=cue,localAudio=f'/assets/phonetics/{identifier}.wav',
                             source=f'https://commons.wikimedia.org/wiki/File:{name}',author='Denelson83',license='CC-BY-SA-3.0',
                             originalSha256=hashlib.sha256(source.read_bytes()).hexdigest()))
    target=ROOT/'src/modules/phonetics/manifest.json'
    fixtures=[r for r in json.loads(target.read_text()) if r.get('synthetic')]
    target.write_text(json.dumps(module.generate(rows)+fixtures,ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__':run()

"""Offline fixtures or explicit build-time TTS import. Never used by the PWA at runtime."""
import argparse, hashlib, json, os, pathlib, urllib.request, wave
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'public/assets/phonetics'
def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def validate(rows):
    ids=set()
    for row in rows:
        assert row['id'] not in ids; ids.add(row['id'])
        assert row['language'] in ('da','en') and row['ipa']
        for key in ('audio','image'):
            path=ROOT/'public'/row[key].lstrip('/')
            assert path.is_file() and digest(path)==row[key+'Sha256'], f"Invalid cache: {path}"
def generate(manifest,endpoint=None):
    OUT.mkdir(parents=True,exist_ok=True); rows=[]
    for row in manifest:
        name=row['id']; assert name.replace('-','').isalnum()
        audio=OUT/f'{name}.wav'; image=OUT/f'{name}.png'; sr=16000
        if endpoint:
            request=urllib.request.Request(endpoint,json.dumps({'text':row['text'],'language':row['language'],'format':'wav'}).encode(),{'Content-Type':'application/json'})
            with urllib.request.urlopen(request,timeout=60) as response: audio.write_bytes(response.read())
            with wave.open(str(audio)) as wav:
                assert wav.getnchannels()==1 and wav.getsampwidth()==2
                sr=wav.getframerate(); signal=np.frombuffer(wav.readframes(wav.getnframes()),dtype='<i2')/32768
        else:
            assert row.get('synthetic'), 'Real speech needs an explicit endpoint and reviewed labels'
            t=np.arange(sr*0.7)/sr; rng=np.random.default_rng(7)
            if row['class']=='vokal':
                formants=row['formants']; signal=sum(np.sin(2*np.pi*f*t)*sum(np.exp(-((f-F)/90)**2) for F in formants) for f in range(120,6000,120))
            elif row['class']=='frikativ':
                noise=rng.normal(size=len(t)); signal=noise-np.roll(noise,1)
            else:
                signal=rng.normal(size=len(t))*((t>0.25)&(t<0.275))
            signal*=np.minimum(1,t/0.025)*np.minimum(1,(0.7-t)/0.025)
            signal=signal/(np.max(np.abs(signal))+1e-9)*0.65
            with wave.open(str(audio),'wb') as wav:
                wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(sr);wav.writeframes((signal*32767).astype('<i2').tobytes())
        size=512;hop=80
        frames=np.array([signal[i:i+size]*np.hanning(size) for i in range(0,len(signal)-size+1,hop)])
        power=np.abs(np.fft.rfft(frames,axis=1))**2
        mel=lambda hz:2595*np.log10(1+hz/700)
        hz=lambda m:700*(10**(m/2595)-1)
        centers=hz(np.linspace(0,mel(sr/2),82)); freq=np.fft.rfftfreq(size,1/sr)
        filters=np.array([np.maximum(0,np.minimum((freq-a)/(b-a),(c-freq)/(c-b))) for a,b,c in zip(centers[:-2],centers[1:-1],centers[2:])])
        db=10*np.log10(np.maximum(power@filters.T,1e-10));db-=db.max()
        fig,ax=plt.subplots(figsize=(8,3),dpi=140)
        ax.imshow(db.T,origin='lower',aspect='auto',cmap='magma',vmin=-65,vmax=0,extent=[0,len(signal)/sr,0,mel(sr/2)])
        ticks=np.array([0,500,1000,2000,4000,8000]);ax.set_yticks(mel(ticks),labels=ticks);ax.set_ylabel('Hz (mel)');ax.set_xlabel('Sekunder')
        fig.tight_layout();fig.savefig(image);plt.close(fig)
        rows.append({**row,'audio':f'/assets/phonetics/{name}.wav','image':f'/assets/phonetics/{name}.png','audioSha256':digest(audio),'imageSha256':digest(image)})
    validate(rows);return rows
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--manifest',default=str(ROOT/'tools/phonetics-dataset/manifest.json'));p.add_argument('--validate',action='store_true');a=p.parse_args()
    target=ROOT/'src/modules/phonetics/manifest.json'
    if a.validate: validate(json.loads(target.read_text())); print('Phonetics cache valid')
    else: target.write_text(json.dumps(generate(json.loads(pathlib.Path(a.manifest).read_text()),os.environ.get('PHONETICS_TTS_ENDPOINT')),ensure_ascii=False,indent=2)+'\n')

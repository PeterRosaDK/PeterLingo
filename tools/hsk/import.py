"""Development-only import: official HSK 2025 PDF, licensed transcription, CC-CEDICT.
No network at runtime. Unresolved dictionary readings remain pinyin-only, never guessed.
"""
import argparse, collections, gzip, hashlib, json, pathlib, re, unicodedata
STANDARD = 'HSK-3.0-2025-11'
ROOT = pathlib.Path(__file__).resolve().parents[2]

def plain(value):
    return re.sub('[^a-z]', '', ''.join(c for c in unicodedata.normalize('NFD', value.lower().replace('u:', 'ü')) if not unicodedata.combining(c)))

def marked(value):
    def syllable(m):
        letters, tone = m.groups(); letters = letters.lower().replace('u:', 'ü').replace('v', 'ü')
        if tone in ('0', '5'): return letters
        index = next((letters.index(v) for v in ('a', 'e') if v in letters), None)
        if index is None: index = letters.index('o') if 'ou' in letters else max((i for i,c in enumerate(letters) if c in 'iouü'), default=-1)
        if index < 0: return letters
        return letters[:index+1] + ['\u0304','\u0301','\u030c','\u0300'][int(tone)-1] + letters[index+1:]
    return unicodedata.normalize('NFC', re.sub(r'([a-zA-ZüÜ:]+)([0-5])', syllable, value)).replace(' ', '').lower()

def import_words(pdf, cedict, licensed):
    from pypdf import PdfReader
    text = '\n'.join(p.extract_text() for p in PdfReader(pdf).pages)
    membership = json.loads(pathlib.Path(licensed).read_text())
    dictionary = {}
    for line in gzip.open(cedict, 'rt'):
        m = re.match(r'^(\S+) (\S+) \[([^]]+)\] /(.+)/$', line)
        if m: dictionary.setdefault(m[2], []).append(m.groups())
    overrides = json.loads((ROOT/'src/modules/flashcards/decks/hsk-da.json').read_text())
    rows = []; unresolved = []; seen = set()
    pattern = r'(?m)^(\d+) ([1-6]|7[—–-]9)(?:（[^）]+）)* ([\u3400-\u9fff]+)(?:\d+)? ([^\n]+)$'
    for match in re.finditer(pattern, text):
        number, level, word, rest = match.groups(); level = level.replace('—','-').replace('–','-')
        assert word in membership['hsk'+level], (number, word, 'not in licensed transcription')
        assert number not in seen; seen.add(number)
        pinyin = unicodedata.normalize('NFC', re.split(r'\s+[\u3400-\u9fff（]', rest)[0].strip())
        variants = pinyin.lower().replace(' ', '').split('/')
        entries = dictionary.get(word, [])
        candidates = [e for e in entries if marked(e[2]) in variants]
        if not candidates:
            candidates = [e for e in entries if plain(e[2]) in [plain(v) for v in variants]]
            # Tone sandhi / neutral-tone conventions are safe only with one dictionary reading.
            if len({marked(e[2]) for e in candidates}) > 1: candidates = []
        meanings = list(dict.fromkeys(s for e in candidates for s in e[3].split('/')))
        if not meanings: unresolved.append({'number':number, 'word':word, 'pinyin':pinyin, 'level':level})
        identifier = f'{STANDARD}-{number}'
        rows.append(dict(id=identifier, simplified=word, traditional=candidates[0][0] if candidates else word,
                         pinyin=pinyin, meaningsDa=overrides.get(identifier, []), meaningsEn=meanings,
                         hskStandard=STANDARD, hskLevel=level))
    assert seen == {str(i) for i in range(1, 11001)}, 'Official vocabulary must contain exactly 11000 numbered records'
    assert set(overrides) <= {r['id'] for r in rows}
    report = {'standard':STANDARD, 'records':len(rows), 'levels':dict(collections.Counter(r['hskLevel'] for r in rows)),
              'danishRecords':sum(bool(r['meaningsDa']) for r in rows), 'unresolvedMeanings':unresolved,
              'sourcesSha256':{key:hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest() for key,path in [('officialPdf',pdf),('licensedTranscription',licensed),('cedict',cedict)]}}
    return rows, report

if __name__ == '__main__':
    p=argparse.ArgumentParser(); p.add_argument('--pdf',required=True); p.add_argument('--cedict',required=True); p.add_argument('--licensed',required=True); p.add_argument('--output',required=True); a=p.parse_args()
    rows,report=import_words(a.pdf,a.cedict,a.licensed)
    pathlib.Path(a.output).write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
    (ROOT/'src/modules/flashcards/decks/hsk-provenance.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))

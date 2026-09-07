"""Explicit development import; requires local official PDF + licensed CC-CEDICT gzip."""
import argparse, gzip, hashlib, json, pathlib, re, unicodedata
STANDARD='HSK-3.0-2025-11'
def import_words(pdf,cedict,selected=None):
 from pypdf import PdfReader
 pages=PdfReader(pdf).pages
 text='\n'.join(p.extract_text() for p in pages)
 dictionary={}
 for line in gzip.open(cedict,'rt'):
  m=re.match(r'^(\S+) (\S+) \[([^]]+)\] /(.+)/$',line)
  if m: dictionary.setdefault(m[2],[]).append(m.groups())
 rows=[];seen=set()
 # Extract only vocabulary rows, not words occurring incidentally in task descriptions.
 for match in re.finditer(r'(?m)^(\d+) ([1-6]|7[—–-]9)(?:（[^）]+）)? ([\u3400-\u9fff]+)(?:\d+)? ([^\n]+)$',text):
  number,level,word,rest=match.groups()
  if selected and word not in selected: continue
  pinyin=re.split(r'\s+[\u3400-\u9fff（]',rest)[0].strip()
  if not re.search('[a-zāáǎàēéěèīíǐìōóǒòūúǔùü]',pinyin): continue
  entries=dictionary.get(word,[])
  # Do not silently guess between heteronyms. Small seed is explicitly selected.
  candidates=[e for e in entries if not e[2][0].isupper()] or entries
  if len(candidates)!=1: continue
  traditional,_,_,meaning=candidates[0]
  identifier=f'{STANDARD}-{number}'
  if identifier in seen: continue
  seen.add(identifier)
  rows.append(dict(id=identifier,simplified=word,traditional=traditional,pinyin=unicodedata.normalize('NFC',pinyin),meaningsDa=[],meaningsEn=meaning.split('/'),hskStandard=STANDARD,hskLevel=level))
 return rows
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--pdf',required=True);p.add_argument('--cedict',required=True);p.add_argument('--output',required=True);p.add_argument('--seed',action='store_true');args=p.parse_args()
 seed=set('爱 八 爸爸 白天 百 包子 杯子 茶 超市 吃 出租车 大 大学 弟弟 电话 电脑 电视 电影 东西 学生 学校 老师 朋友 中国'.split()) if args.seed else None
 rows=import_words(args.pdf,args.cedict,seed)
 pathlib.Path(args.output).write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
 print(f'{len(rows)} records. Review omitted heteronyms and redistribution rights before publishing a full import.')
 print('PDF SHA256',hashlib.sha256(pathlib.Path(args.pdf).read_bytes()).hexdigest())
 print('CC-CEDICT SHA256',hashlib.sha256(pathlib.Path(args.cedict).read_bytes()).hexdigest())

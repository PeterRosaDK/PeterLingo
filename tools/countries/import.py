"""Explicit import of pinned country facts, UN review results and local flag archive.
Country/capital editorial overrides below are intentional, reviewed domain content.
"""
import argparse,json,pathlib,tarfile,collections,hashlib
parser=argparse.ArgumentParser()
for arg in ['countries','names','un-profiles','flags','license']: parser.add_argument('--'+arg,required=True)
args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parents[2];src=json.load(open(args.countries));names=json.load(open(args.names));un=json.load(open(args.un_profiles))
source='https://github.com/mledoze/countries/tree/c8015eebdd94c533358406b0d709f441389e1f2e'
capital_da=dict(line.split('=',1) for line in '''AT=Wien
BE=Bruxelles
CZ=Prag
DK=København
GR=Athen
HU=Budapest
IS=Reykjavík
IT=Rom
PL=Warszawa
PT=Lissabon
RO=Bukarest
RU=Moskva
RS=Beograd
UA=Kyiv
DZ=Algier
EG=Kairo
IR=Teheran
SY=Damaskus
CN=Beijing
KP=Pyongyang
MN=Ulaanbaatar
US=Washington D.C.
MX=Mexico City
GT=Guatemala City
PA=Panama City
VA=Vatikanstaten
SM=San Marino
AM=Jerevan
AZ=Baku
KG=Bisjkek
TJ=Dusjanbe
TM=Asjkhabad
UZ=Tasjkent
XK=Pristina
GQ=Ciudad de la Paz
LK=Sri Jayewardenepura Kotte
PS=Østjerusalem
KI=South Tarawa
PW=Ngerulmud'''.splitlines())
notes={
'AF':'Dette kort bruger republikkens sort-rød-grønne flag. Talibanmyndighederne bruger et hvidt flag med sort skrift.',
'ZA':'Pretoria er administrativ hovedstad, Cape Town lovgivende og Bloemfontein traditionelt retslig hovedstad. Forfatningsdomstolen ligger i Johannesburg.',
'SZ':'Mbabane er administrativ hovedstad; Lobamba er kongelig og lovgivende hovedstad.',
'BO':'Sucre er den forfatningsmæssige hovedstad; regering og parlament har sæde i La Paz.',
'NL':'Amsterdam er hovedstaden; regering og parlament har sæde i Haag.',
'LK':'Sri Jayewardenepura Kotte er administrativ hovedstad. Colombo er handelscentrum og rummer fortsat centrale offentlige funktioner.',
'PS':'Østjerusalem er den erklærede hovedstad; Ramallah er administrativt centrum. Jerusalems endelige status er omstridt.',
'IL':'Israel betegner Jerusalem som hovedstad. Byens endelige status er omstridt og er ifølge FN et forhandlingsspørgsmål.',
'NR':'Nauru har ingen officielt udpeget hovedstad. Regeringskontorerne ligger i Yaren-distriktet.',
'CH':'Bern er forbundsbyen og regeringssædet; betegnelsen hovedstad bruges almindeligt.',
'MY':'Kuala Lumpur er hovedstaden; Putrajaya er det føderale administrative centrum.',
'BJ':'Porto-Novo er den officielle hovedstad; mange regeringsfunktioner ligger i Cotonou.',
'CI':'Yamoussoukro er den officielle hovedstad; Abidjan er et vigtigt administrativt og økonomisk centrum.',
'GQ':'Ciudad de la Paz blev ved dekret udpeget som hovedstad 2. januar 2026. Malabo var den tidligere hovedstad.',
'ID':'Jakarta er det nuværende facit. Flytningen til Nusantara er en igangværende proces; hovedstadsstatus skal følges ved kommende datarevisioner.',
'PW':'Ngerulmud ligger i delstaten Melekeok. Delstatens navn forekommer også som hovedstadsangivelse i nogle oversigter.',
'KI':'South Tarawa er hovedstadsområdet. Bairiki er et af områdets administrative centre.',
'VA':'Vatikanstaten; Den Hellige Stol har observatørstatus i FN.',
'XK':'Kosovo er delvist internationalt anerkendt og er ikke medlem af FN.',
'TW':'Taiwan er selvstyret, har omstridt international status og er ikke medlem af FN.',
'GB':'Landet omfatter Storbritannien og Nordirland.',
}
extra_sources={
'AF':'https://www.awm.gov.au/collection/C2905605',
'GQ':'https://www.guineaecuatorialpress.com/index.php/noticias/el_presidente_de_la_republica_proclama_la_ciudad_de_la_paz_como_capital_de_la_republica_de_guinea_ecuatorial_con_la_firma_de_un_decreto_ley',
'ZA':'https://www.gov.za/south-africa-glance',
'LK':'https://www.uda.gov.lk/attachments/dev-plans-2021-2030/kotte_development_plan_Eng.pdf.pdf',
'PS':'https://data.un.org/en/iso/ps.html',
'IL':'https://press.un.org/en/2023/sgsm21684.doc.htm',
'SZ':'https://www.getty.edu/vow/TGNFullDisplay?english=N&find=7277711&nation=&place=&subjectid=1094532',
'ID':'https://www.ikn.go.id/2026',
}
rows=[]
for c in src:
 code=c['cca2']
 if not(c['unMember'] or code in ['PS','XK','TW']):continue
 region={'Europe':'Europa','Asia':'Asien','Africa':'Afrika','Oceania':'Oceanien','Americas':'Sydamerika' if c['subregion']=='South America' else 'Nordamerika'}[c['region']]
 capitals=[{'name':capital_da.get(code,n),'role':''} for n in c['capital']]
 if code=='ZA':capitals=[{'name':'Pretoria','role':'administrativ'},{'name':'Cape Town','role':'lovgivende'},{'name':'Bloemfontein','role':'retslig'}]
 if code=='SZ':capitals=[{'name':'Mbabane','role':'administrativ'},{'name':'Lobamba','role':'kongelig og lovgivende'}]
 name={'PS':'Palæstina','CD':'Den Demokratiske Republik Congo','CG':'Republikken Congo'}.get(code,names[code])
 row=dict(id=code,country=name,capital=' · '.join(n['name'] for n in capitals),capitals=capitals,region=region,flag=c['flag'],flagSvg=f'/assets/flags/{code.lower()}.svg',status='observer' if code in ['PS','VA'] else 'additional' if code in ['XK','TW'] else 'un-member',note=notes.get(code,''))
 row['sources']=[source]+([f'https://data.un.org/en/iso/{code.lower()}.html'] if un.get(code) else [])+([extra_sources[code]] if code in extra_sources else [])
 rows.append(row)
# Preserve the previous deck's introduction order and every ISO/direction ID.
first='PT DK SE NO FI IS DE FR ES IT JP KR'.split();rows.sort(key=lambda r:(first.index(r['id']) if r['id'] in first else 100,r['country']))
assert len(rows)==197 and sum(r['status']=='un-member' for r in rows)==193
(root/'src/modules/flashcards/decks/countries.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
with tarfile.open(args.flags) as tar:
 for r in rows:
  suffix=f'/flags/4x3/{r["id"].lower()}.svg';member=next(m for m in tar.getmembers() if m.name.endswith(suffix));data=tar.extractfile(member).read();assert b'<svg' in data
  (root/'public'/r['flagSvg'].lstrip('/')).write_bytes(data)
 license=next(m for m in tar.getmembers() if m.name.endswith('/LICENSE'));(root/'public/assets/flags/LICENSE').write_bytes(tar.extractfile(license).read())
(root/'tools/countries/LICENSE-ODbL').write_text(pathlib.Path(args.license).read_text())
report={'reviewedAt':'2026-09-09','records':len(rows),'regions':dict(collections.Counter(r['region'] for r in rows)),'countrySourceCommit':'c8015eebdd94c533358406b0d709f441389e1f2e','countrySourceSha256':hashlib.sha256(pathlib.Path(args.countries).read_bytes()).hexdigest(),'flagSourceCommit':'086f7e97d657358203916dbe84f61c2bccaa81eb','nameSource':'Unicode CLDR 48 via Node Intl.DisplayNames da','unProfilesChecked':sum(bool(v) for v in un.values()),'unCapitalLabels':un}
(root/'tools/countries/provenance.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(report['regions'])

# Offer the adapted database and license directly from the offline app as required by ODbL.
(root/'public/assets/data').mkdir(parents=True,exist_ok=True)
(root/'public/assets/data/countries.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
(root/'public/assets/data/countries-LICENSE.txt').write_text(pathlib.Path(args.license).read_text())

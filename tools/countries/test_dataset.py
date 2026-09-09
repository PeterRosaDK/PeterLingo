import collections,json,pathlib,unittest,xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[2]
class GeographyTests(unittest.TestCase):
 def setUp(self):self.rows=json.loads((ROOT/'src/modules/flashcards/decks/countries.json').read_text())
 def test_scope_and_regions(self):
  self.assertEqual(len(self.rows),197)
  self.assertEqual(len({r['id'] for r in self.rows}),197)
  self.assertEqual(collections.Counter(r['status'] for r in self.rows),{'un-member':193,'observer':2,'additional':2})
  self.assertEqual(set(r['region'] for r in self.rows),{'Europa','Asien','Afrika','Nordamerika','Sydamerika','Oceanien'})
  self.assertEqual({r['id'] for r in self.rows if r['status']=='observer'},{'VA','PS'})
 def test_complete_local_flags_and_capitals(self):
  for r in self.rows:
   self.assertTrue(r['country'] and r['capital'] and r['sources'])
   self.assertEqual(r['capital'],' · '.join(c['name'] for c in r['capitals']))
   path=ROOT/'public'/r['flagSvg'].lstrip('/')
   svg=ET.parse(path).getroot();self.assertTrue(svg.tag.endswith('svg'))
   for node in svg.iter():
    self.assertFalse(node.tag.endswith('script'))
    for key,value in node.attrib.items():
     if key.endswith('href'):self.assertTrue(value.startswith('#'),'Flag must not fetch external resources')
 def test_reviewed_exceptions_and_download(self):
  rows={r['id']:r for r in self.rows}
  self.assertEqual(rows['GQ']['capital'],'Ciudad de la Paz')
  self.assertEqual(rows['LK']['capital'],'Sri Jayewardenepura Kotte')
  self.assertEqual(len(rows['ZA']['capitals']),3)
  self.assertEqual(len(rows['SZ']['capitals']),2)
  self.assertIn('ingen officielt',rows['NR']['note'])
  self.assertEqual(json.loads((ROOT/'public/assets/data/countries.json').read_text()),self.rows)
if __name__=='__main__':unittest.main()

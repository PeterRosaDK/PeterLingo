import copy,json,unittest
from generate import ROOT,validate
class CacheTests(unittest.TestCase):
 def setUp(self): self.rows=json.loads((ROOT/'src/modules/phonetics/manifest.json').read_text())
 def test_complete_cache(self): validate(self.rows)
 def test_changed_digest(self):
  self.rows[0]['audioSha256']='wrong'
  with self.assertRaises(AssertionError): validate(self.rows)
 def test_duplicate_id(self):
  self.rows.append(copy.deepcopy(self.rows[0]))
  with self.assertRaises(AssertionError): validate(self.rows)
 def test_missing_asset(self):
  self.rows[0]['image']='/assets/phonetics/does-not-exist.png'
  with self.assertRaises(AssertionError): validate(self.rows)
if __name__=='__main__':unittest.main()

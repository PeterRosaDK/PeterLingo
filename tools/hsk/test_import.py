"""No-network checks for importer pronunciation matching and complete committed output."""
import importlib.util,json,pathlib,unittest
ROOT=pathlib.Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('hsk_import',pathlib.Path(__file__).with_name('import.py'))
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class ImportTests(unittest.TestCase):
 def test_tones_and_umlaut(self):
  self.assertEqual(module.marked('tu2 shu1 guan3'),'túshūguǎn')
  self.assertEqual(module.marked('nu:3'),'nǚ')
  self.assertEqual(module.marked('liu2'),'liú')
  self.assertEqual(module.marked('gui4'),'guì')
  self.assertEqual(module.marked('Zhong1 guo2'),'zhōngguó')
  self.assertEqual(module.marked('ba4 ba5'),'bàba')
 def test_complete_numbered_output_and_danish_layer(self):
  rows=json.loads((ROOT/'src/modules/flashcards/decks/hsk.json').read_text())
  self.assertEqual({r['id'] for r in rows},{f'HSK-3.0-2025-11-{i}' for i in range(1,11001)})
  overrides=json.loads((ROOT/'src/modules/flashcards/decks/hsk-da.json').read_text())
  self.assertEqual(sum(bool(r['meaningsDa']) for r in rows),106)
  for r in rows:
   self.assertEqual(r['meaningsDa'],overrides.get(r['id'],[]))
if __name__=='__main__':unittest.main()

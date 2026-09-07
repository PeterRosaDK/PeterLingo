import subprocess, unittest
from generate import execute, generate
class GroundTruthTests(unittest.TestCase):
 def test_timeout(self):
  with self.assertRaises(subprocess.TimeoutExpired): execute('while True: pass',1,0.1)
 def test_exception_and_prior_stdout(self):
  self.assertEqual(execute('print("before")\nraise ValueError()',1),{'stdout':'before\n','exception':'ValueError'})
 def test_hash_randomization(self):
  source='print({"apple", "banana", "pear", "cherry"})'
  self.assertNotEqual(execute(source,1),execute(source,17))
 def test_no_external_effects(self):
  with self.assertRaises(ValueError): execute('import os',1)
 def test_corpus(self):
  self.assertGreaterEqual(len(generate()['snippets']),40)
if __name__=='__main__': unittest.main()

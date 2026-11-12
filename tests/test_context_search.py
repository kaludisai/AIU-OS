from pathlib import Path
import importlib.util,tempfile,unittest
source=Path(__file__).resolve().parents[1]/'scripts/find_context.py'
spec=importlib.util.spec_from_file_location('context_search',source);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class SearchChecks(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
        for name in ('brief','personal','assets'): (self.root/name).mkdir()
        (self.root/'brief/now.md').write_text('Budget: $120\nOne VEGETARIAN guest\n')
        (self.root/'personal/notes.md').write_text('Vegetarian private note\n')
    def tearDown(self):self.tmp.cleanup()
    def test_casefold_and_line_evidence(self):
        h=module.search('vegetarian',['brief'],self.root);self.assertEqual(h,[{'path':'brief/now.md','line':2,'text':'One VEGETARIAN guest'}])
    def test_private_is_opt_in(self):
        h=module.search('vegetarian',module.DEFAULTS,self.root);self.assertEqual(len(h),1)
        self.assertEqual(len(module.search('vegetarian',['personal'],self.root)),1)
    def test_no_hits_and_limits(self):
        self.assertEqual(module.search('missing',['brief'],self.root),[])
        self.assertEqual(len(module.search('e',['brief'],self.root,limit=1)),1)
    def test_escape_and_secret_scopes_rejected(self):
        for path in ('..','../elsewhere','.env','assets/api-key.md'):
            with self.subTest(path=path),self.assertRaises(ValueError):module.search('x',[path],self.root)
    def test_symlinks_and_secret_names_not_read(self):
        (self.root/'assets/passwords.md').write_text('Vegetarian secret')
        (self.root/'assets/link.md').symlink_to(self.root/'personal/notes.md')
        self.assertEqual(module.search('vegetarian',['assets'],self.root),[])
        with self.assertRaises(ValueError):module.search('vegetarian',['assets/link.md'],self.root)
    def test_literal_not_regex(self):self.assertEqual(module.search('.*',['brief'],self.root),[])
if __name__=='__main__':unittest.main(verbosity=2)

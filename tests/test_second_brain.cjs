const assert = require('node:assert/strict');
const path = require('node:path');
const K = require(path.resolve(__dirname, '../apps/second-brain/knowledge.js'));
let count = 0;
function check(name, fn) { fn(); count++; console.log('PASS: '+name); }
check('reject unsafe or private paths',()=>{
 for(const bad of ['/abs.md','../escape.md','x/../../a.md','private/x.md','personal/a.md','.env','x/.git/a.md','C:\\x.md','x/node_modules/a.md','a/12_Private/x.md']) assert.equal(K.cleanPath(bad),null,bad);
 assert.equal(K.cleanPath('Memory/Hello.md'),'Memory/Hello.md');
});
const fixture=K.normalize([
 {path:'A/Hub.md',body:'# Hub\n\n[[Local]] [[B/Other]] [[Missing]] [relative](../B/Other.md)\n```\n[[Fake]]\n```'},
 {path:'A/Local.md',body:'# Local\n\n[[Hub]]'},
 {path:'B/Other.md',body:'# Other\n\n[[Hub]]'},
 {path:'C/Local.md',body:'# Local\n\nPlain note.'},
 {path:'Root.md',body:'# Root\n\n[[Local]]'},
]);
const g=K.buildGraph(fixture.notes);
check('resolve local, root and relative links with backlinks',()=>{
 assert.deepEqual(g.outgoing.get('A/Hub.md'),['A/Local.md','B/Other.md']);
 assert.deepEqual(g.backlinks.get('A/Hub.md'),['A/Local.md','B/Other.md']);
 assert.equal(g.nodes.find(n=>n.id==='A/Hub.md').degree,2);
});
check('do not guess ambiguous titles or count code samples',()=>{
 assert.deepEqual(g.outgoing.get('Root.md'),[]);
 assert.deepEqual(g.unresolved.get('Root.md'),['Local']);
 assert.deepEqual(g.unresolved.get('A/Hub.md'),['Missing']);
});
check('literal body search and group filter',()=>{
 assert.equal(K.search(fixture.notes,'plain','C').length,1);
 assert.equal(K.search(fixture.notes,'plain','A').length,0);
 assert.equal(K.search(fixture.notes,'[not a regex').length,0);
});
check('deduplicate case-insensitive paths and enforce limits',()=>{
 const x=K.normalize([{path:'a.md',body:'# One'},{path:'A.md',body:'# Two'},{path:'huge.md',body:'x'.repeat(K.MAX_FILE_BYTES+1)}]);
 assert.equal(x.notes.length,1);assert.equal(x.skipped,2);
 const y=K.normalize(Array.from({length:501},(_,i)=>({path:`n${i}.md`,body:'x'})));
 assert.equal(y.notes.length,500);assert.equal(y.skipped,1);
});
check('backup round-trips content and rejects invalid shapes',()=>{
 assert.deepEqual(K.parseBackup(K.backup(fixture.notes)).notes,fixture.notes);
 for(const text of ['nope','{}','{"format":"aiu-second-brain","version":9,"notes":[]}']) assert.throws(()=>K.parseBackup(text));
});
check('external protocols are never note graph links',()=>{
 const x=K.buildGraph(K.normalize([{path:'X.md',body:'# X\n[j](javascript:alert) [[https://example.com]] [m](mailto:a@b.com)'}]).notes);
 assert.equal(x.links.length,0);assert.deepEqual(x.unresolved.get('X.md'),[]);
});
check('root-relative links choose library root over same-folder names',()=>{
 const x=K.buildGraph(K.normalize([{path:'Folder/Source.md',body:'# Source\n[link](/Target.md)'},{path:'Folder/Target.md',body:'# Local target'},{path:'Target.md',body:'# Root target'}]).notes);
 assert.deepEqual(x.outgoing.get('Folder/Source.md'),['Target.md']);
});
check('largest accepted escaped bodies export and restore',()=>{
 for (const character of ['"','\u0000']) {
  const notes=K.normalize(Array.from({length:32},(_,i)=>({path:`n${i}.md`,body:character.repeat(K.MAX_FILE_BYTES)}))).notes;
  const text=K.backup(notes);
  assert.equal(K.parseBackup(text).notes.length,32);
 }
});
console.log(`${count} data-model checks passed.`);

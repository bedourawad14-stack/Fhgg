// Usage: node tools/check.mjs <folder> [manifest]
// Compares a folder (your repo's public/, the build's dist/, or an unzipped APK's assets/public) with FILES_MANIFEST.txt
import fs from 'fs'; import path from 'path'; import crypto from 'crypto';
const dir = process.argv[2]; const man = process.argv[3] || path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'FILES_MANIFEST.txt');
if (!dir) { console.error('usage: node tools/check.mjs <folder> [FILES_MANIFEST.txt]'); process.exit(1); }
const rows = fs.readFileSync(man, 'utf8').split('\n').filter(l => l && !l.startsWith('#')).map(l => { const [size, sha, ...p] = l.split(/\s+/); return { size: +size, sha, p: p.join(' ') }; });
let bad = 0;
for (const r of rows) {
  const f = path.join(dir, r.p);
  if (!fs.existsSync(f)) { console.log('MISSING   ', r.p, `(${(r.size / 1e6).toFixed(2)} MB)`); bad++; continue; }
  const b = fs.readFileSync(f), s = b.length;
  if (s < 2000 && b.toString('utf8', 0, 40).startsWith('version https://git-lfs')) { console.log('LFS-POINTER', r.p, '(a pointer file, not the real file)'); bad++; continue; }
  if (s !== r.size) { console.log('WRONG SIZE', r.p, `expected ${r.size}, found ${s}`); bad++; continue; }
  if (crypto.createHash('sha256').update(b).digest('hex').slice(0, 16) !== r.sha) { console.log('MODIFIED  ', r.p, '(same size, different content)'); bad++; }
}
console.log(bad ? `\n${bad} problem(s) found out of ${rows.length} files` : `\nAll ${rows.length} files present and identical`);
process.exit(bad ? 2 : 0);

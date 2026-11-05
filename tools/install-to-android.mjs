// Usage: node tools/install-to-android.mjs <project-root>
// Copies this package's public/ straight into the Android project's assets (no AI Studio / Vite step in between),
// then verifies every file against FILES_MANIFEST.txt.
import fs from 'fs'; import path from 'path'; import crypto from 'crypto'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), pkg = path.join(here, '..');
const root = process.argv[2]; if (!root) { console.error('usage: node tools/install-to-android.mjs <project-root>'); process.exit(1); }
const cands = [path.join(root, 'android/app/src/main/assets'), path.join(root, 'app/src/main/assets'), path.join(root, 'src/main/assets')];
const assets = cands.find(p => fs.existsSync(p)); if (!assets) { console.error('Could not find app/src/main/assets under', root); process.exit(1); }
const dest = path.join(assets, 'public');
fs.rmSync(dest, { recursive: true, force: true }); fs.cpSync(path.join(pkg, 'public'), dest, { recursive: true });
console.log('copied to', dest);
const rows = fs.readFileSync(path.join(pkg, 'FILES_MANIFEST.txt'), 'utf8').split('\n').filter(l => l && !l.startsWith('#')).map(l => { const [size, sha, ...p] = l.split(/\s+/); return { size: +size, sha, p: p.join(' ') }; });
let bad = 0, total = 0;
for (const r of rows) { const f = path.join(dest, r.p); if (!fs.existsSync(f)) { console.log('MISSING', r.p); bad++; continue; } const b = fs.readFileSync(f); total += b.length; if (b.length !== r.size || crypto.createHash('sha256').update(b).digest('hex').slice(0, 16) !== r.sha) { console.log('DIFFERENT', r.p); bad++; } }
console.log(bad ? `${bad} problem(s)` : `OK: ${rows.length} files, ${(total / 1e6).toFixed(1)} MB copied and verified`);
if (!fs.existsSync(path.join(dest, 'audio/quran.mp3'))) console.log('NOTE: put your Quran file at', path.join(dest, 'audio/quran.mp3'));
console.log('Next: build the APK from Android Studio / ./gradlew assembleDebug (do NOT run vite build or open this in AI Studio, it can overwrite these files).');
process.exit(bad ? 2 : 0);

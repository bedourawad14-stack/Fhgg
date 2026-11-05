// Usage: node tools/seal.mjs public      (run after ANY legitimate change to the game files)
import fs from 'fs'; import path from 'path'; import crypto from 'crypto';
const dir = process.argv[2] || 'public';
const idxPath = path.join(dir, 'index.html');
let html = fs.readFileSync(idxPath, 'utf8');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const refs = [...html.matchAll(/(?:src|href)=["'](\.?\/?assets\/[^"']+\.(?:js|css))["']/g)].map(m => m[1].replace(/^\.?\//, ''));
const files = {};
for (const r of [...new Set(refs)]) files[r] = sha(fs.readFileSync(path.join(dir, r)));
function garageBlock(t) { const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi; let m; const o = []; while ((m = re.exec(t))) { if (m[1].indexOf('GameBridge') > -1 && m[1].length > 5000) o.push(m[1]); } return o.join('\n'); }
const garage = {};
const gp = path.join(dir, 'garage-ui-1.html');
if (fs.existsSync(gp)) garage['garage-ui-1.html'] = sha(Buffer.from(garageBlock(fs.readFileSync(gp, 'utf8')), 'utf8'));
const sizes = {};
(function walk(d) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else { const rel = path.relative(dir, p).split(path.sep).join('/'); if (/^(models|textures)\//.test(rel) && /\.(glb|gltf|jpg|jpeg|png|webp|ktx2)$/i.test(rel)) sizes[rel] = fs.statSync(p).size; } } })(dir);
const seal = JSON.stringify({ files, garage, sizes });
const re = /var SEAL_JSON='[^']*';/;
if (!re.test(html)) { console.error('SEAL_JSON slot not found in index.html'); process.exit(1); }
html = html.replace(re, () => "var SEAL_JSON='" + seal.replace(/'/g, "\\'") + "';");
fs.writeFileSync(idxPath, html);
console.log('sealed:', Object.keys(files).length, 'code files,', Object.keys(garage).length, 'garage,', Object.keys(sizes).length, 'asset sizes');

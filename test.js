const fs = require('fs');
for (const file of ['index.html','style.css','app.js']) {
  if (!fs.existsSync(file)) throw new Error(`${file} missing`);
}
const html = fs.readFileSync('index.html','utf8');
const js = fs.readFileSync('app.js','utf8');
for (const needle of ['Lullaby Codex','ENTER THE SIGNAL','app.js']) {
  if (!html.includes(needle)) throw new Error(`index missing ${needle}`);
}
for (const needle of ['261.63','392.00','analyze','playSignal','Welcome home, Codex']) {
  if (!js.includes(needle)) throw new Error(`app missing ${needle}`);
}
new Function(js.replace(/const canvas = document.getElementById\('terminal'\);[\s\S]*/, ''));
console.log('static demo checks passed');

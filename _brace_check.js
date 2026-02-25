const fs = require('fs');
const c = fs.readFileSync('src/scenes/MainGameScene.jsx', 'utf8');
let opens = 0, closes = 0;
for (const ch of c) {
  if (ch === '{') opens++;
  if (ch === '}') closes++;
}
console.log('opens:', opens, 'closes:', closes, 'diff:', opens - closes);

// Also find where brace count goes negative or hits zero for each line
const lines = c.split('\r\n');
let count = 0;
for (let i = 0; i < lines.length; i++) {
  for (const ch of lines[i]) {
    if (ch === '{') count++;
    if (ch === '}') count--;
  }
  if (count <= 0 && i < lines.length - 5) {
    console.log('Brace count hits ' + count + ' at line ' + (i+1) + ': ' + lines[i].substring(0, 60));
  }
}

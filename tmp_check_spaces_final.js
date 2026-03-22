const fs = require('fs');
const content = fs.readFileSync('d:/Dilpreet Singh/My Projects/FlipiAlbumGen-1/client/src/components/Flipbook.tsx', 'utf8');
const lines = content.split('\n');
for (let i = 300; i < 600; i++) {
  if (lines[i]?.includes('playFlipSound();')) {
    console.log(`Line ${i+1}: Indent=${lines[i].match(/^ */)[0].length} spaces. [${lines[i]}]`);
  }
}

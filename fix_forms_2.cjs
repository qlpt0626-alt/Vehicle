const fs = require('fs');
const path = require('path');

const dir = './src/components';
const files = fs.readdirSync(dir).filter(f => f.includes('Form.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const badStr = '{(!isLocked || isAdmin) && (\n              \n            )}';
  if (content.includes(badStr)) {
    content = content.replace(badStr, '');
    changed = true;
  }
  
  const badStr2 = '{(!isLocked || isAdmin) && (\n                \n              )}';
  if (content.includes(badStr2)) {
    content = content.replace(badStr2, '');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}

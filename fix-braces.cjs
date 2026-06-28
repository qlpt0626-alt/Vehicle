const fs = require('fs');
const files = fs.readdirSync('src/components').filter(f => f.endsWith('Form.tsx')).map(f => 'src/components/' + f);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  content = content.replace(/      \}\n        \}\n      \}\n\n      if \(foundDoc\) \{/g, '      }\n\n      if (foundDoc) {');
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Fixed ${file}`);
  }
}

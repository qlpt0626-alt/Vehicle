const fs = require('fs');

function fixSort(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  content = content.replace(
    /\.sort\([\s\S]*?\(a.*?,\s*b.*?\)\s*=>\s*new Date\(b\.createdAt\s*\|\|\s*0\)\.getTime\(\)\s*-\s*new Date\(a\.createdAt\s*\|\|\s*0\)\.getTime\(\),?\s*\)/g,
    '.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())'
  );
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Replaced in ${filePath}`);
  }
}

fixSort('src/components/RepairRecordsTab.tsx');

let dbContent = fs.readFileSync('src/services/dbService.ts', 'utf8');
let oriDbContent = dbContent;

dbContent = dbContent.replace(/new Date\(b\.createdAt\)\.getTime\(\) - new Date\(a\.createdAt\)\.getTime\(\)/g, "new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime()");
dbContent = dbContent.replace(/const dateA = new Date\(a\.createdDate \|\| a\.createdAt\)\.getTime\(\);/g, "const dateA = new Date(a.updatedAt || a.createdDate || a.createdAt || 0).getTime();");
dbContent = dbContent.replace(/const dateB = new Date\(b\.createdDate \|\| b\.createdAt\)\.getTime\(\);/g, "const dateB = new Date(b.updatedAt || b.createdDate || b.createdAt || 0).getTime();");
dbContent = dbContent.replace(/const dateA = new Date\(\(a as any\)\.deletedAt \|\| a\.createdAt\)\.getTime\(\);/g, "const dateA = new Date((a as any).deletedAt || a.updatedAt || a.createdAt || 0).getTime();");
dbContent = dbContent.replace(/const dateB = new Date\(\(b as any\)\.deletedAt \|\| b\.createdAt\)\.getTime\(\);/g, "const dateB = new Date((b as any).deletedAt || b.updatedAt || b.createdAt || 0).getTime();");

if (dbContent !== oriDbContent) {
  fs.writeFileSync('src/services/dbService.ts', dbContent);
  console.log('Replaced in dbService.ts');
}

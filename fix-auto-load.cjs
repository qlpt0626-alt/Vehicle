const fs = require('fs');
const files = fs.readdirSync('src/components').filter(f => f.endsWith('Form.tsx')).map(f => 'src/components/' + f);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // This Regex targets the first block (LocalStorage lookup)
  content = content.replace(/if \(!foundDoc\) \{\s*if \(existingFormId\) \{\s*foundDoc = list\.find\(\(item: any\) => item\.id === existingFormId[^\)]*\);\s*if \(foundDoc\) matchedCount\+\+;\s*\}\s*else if \(vehicle\) \{[\s\S]*?(?=\n\s*\})\n\s*\}\s*\}/g,
  `if (!foundDoc) {
        if (existingFormId) {
          foundDoc = list.find((item: any) => item.id === existingFormId && !item.isDeleted);
          if (foundDoc) matchedCount++;
        }
      }`);

  // This Regex targets the second block (Firebase lookup)
  content = content.replace(/if \(!foundDoc\) \{\s*if \(existingFormId\) \{\s*const dbDoc = await DataService\.get\('repairForms', existingFormId\);\s*if \(dbDoc && !dbDoc\.isDeleted\) \{\s*foundDoc = dbDoc;\s*matchedCount\+\+;\s*\}\s*\}\s*else if \(vehicle\) \{[\s\S]*?(?=\n\s*\})\n\s*\}\s*\}/g,
  `if (!foundDoc) {
        if (existingFormId) {
          const dbDoc = await DataService.get('repairForms', existingFormId);
          if (dbDoc && !dbDoc.isDeleted) {
            foundDoc = dbDoc;
            matchedCount++;
          }
        }
      }`);
      
  // Also remove logic where it looks up existing forms to assign docId automatically in the fallback part below
  content = content.replace(/if \(!existingFormId\) \{[\s\S]*?const dbForms = await DataService\.load\('repairForms'\);[\s\S]*?\}\s*\} catch \(err\) \{\}/g, '');

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Fixed ${file}`);
  }
}

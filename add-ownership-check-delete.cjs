const fs = require('fs');

const files = [
  'src/components/EngineInspectionBeforeRepairForm.tsx',
  'src/components/InteriorInspectionBeforeRepairForm.tsx',
  'src/components/BodyInspectionBeforeRepairForm.tsx',
  'src/components/PaintInspectionBeforeRepairForm.tsx',
  'src/components/GeneralDisassemblyRepairForm.tsx',
  'src/components/EngineComponentDisassemblyForm.tsx',
  'src/components/EngineComponentRepairForm.tsx',
  'src/components/PartsCleaningRepairForm.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Regex handles \n and \r\n and whitespace variations
  const searchPattern = /  const handleDelete = async \(\) => \{\r?\n    let confirmed = false;/g;
  const replacement = `  const handleDelete = async () => {
    try {
      const currentUser = getCurrentUserSession();
      let existingDoc = null;
      try {
        existingDoc = await DataService.get('repairForms', docId);
      } catch (err) {}
      if (existingDoc && currentUser && !canEditDocument(currentUser, existingDoc)) {
        alert('Bạn chỉ có quyền xem dữ liệu.');
        return;
      }
    } catch(err) {}

    let confirmed = false;`;
  
  if (!content.includes(`if (existingDoc && currentUser && !canEditDocument(currentUser, existingDoc))`)) {
     content = content.replace(searchPattern, replacement);
  }

  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
}

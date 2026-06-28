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

  // STEP 5.5: handleSave
  // Use regex to catch arbitrary white spaces and \r?\n
  const saveSearchPattern = /      \} catch \(err\) \{\}\r?\n\r?\n      const payload = \{/g;
  const saveReplacement = `      } catch (err) {}\n\n      if (existingDoc && currentUser && !canEditDocument(currentUser, existingDoc)) {\n        alert('Bạn chỉ có quyền xem dữ liệu.');\n        return;\n      }\n\n      const payload = {`;
  
  if (!content.includes('if (existingDoc && currentUser && !canEditDocument(currentUser, existingDoc)) {')) {
      content = content.replace(saveSearchPattern, saveReplacement);
  }

  // STEP 5.6: handleDelete
  const deleteSearchPattern = /  const handleDelete = async \(\) => \{\r?\n    let confirmed = false;/g;
  const deleteReplacement = `  const handleDelete = async () => {
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

  // We check if we ALREADY added it in handleDelete to avoid double injection, but the replace string is specific enough
  content = content.replace(deleteSearchPattern, deleteReplacement);

  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
}

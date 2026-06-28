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

const badString = `      } catch (err) {}\n\n      if (existingDoc && currentUser && !canEditDocument(currentUser, existingDoc)) {\n        alert('Bạn chỉ có quyền xem dữ liệu.');\n        return;\n      }`;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Replace all bad instances back to normal
  content = content.split(badString).join(`      } catch (err) {}`);

  fs.writeFileSync(file, content);
  console.log(`Cleaned ${file}`);
}

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

  // Add import if not exists
  if (!content.includes('canEditDocument')) {
    const match = content.match(/^import .*?\n/m);
    if(match) {
        content = `import { canEditDocument } from '../services/ownershipService';\n` + content;
    }
  }

  // Insert the ownership check
  const searchPattern = `      } catch (err) {}`;
  const replacement = `      } catch (err) {}\n\n      if (existingDoc && currentUser && !canEditDocument(currentUser, existingDoc)) {\n        alert('Bạn chỉ có quyền xem dữ liệu.');\n        return;\n      }`;
  
  if (!content.includes(`alert('Bạn chỉ có quyền xem dữ liệu.');`)) {
    content = content.replace(searchPattern, replacement);
  }

  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
}

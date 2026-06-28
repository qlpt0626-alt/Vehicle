const fs = require('fs');
const path = require('path');

const dir = './src/components';
const files = fs.readdirSync(dir).filter(f => f.includes('Form.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const notesRegex = /\s*<div className="mt-8 pt-4 border-t border-dashed border-stone-300 print:border-none print:pt-0">\s*<AutoResizeTextarea\s*value=\{formData\.additionalNotes \|\| ''\}\s*onChange=\{\(e\) => setFormData\(\{\.\.\.formData, additionalNotes: e\.target\.value\}\)\}\s*className="w-full min-h-\[100px\] bg-transparent outline-none text-\[15px\] leading-loose text-emerald-700 print:text-black border-none resize-none"\s*placeholder="Điền thêm thông tin\.\.\."\s*\/>\s*<\/div>/g;

  if (notesRegex.test(content)) {
    content = content.replace(notesRegex, '');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}

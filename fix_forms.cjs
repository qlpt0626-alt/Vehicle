const fs = require('fs');
const path = require('path');

const dir = './src/components';
const files = fs.readdirSync(dir).filter(f => f.includes('Form.tsx'));

const bottomNotesHtml = `
          <div className="mt-8 pt-4 border-t border-dashed border-stone-300 print:border-none print:pt-0">
            <AutoResizeTextarea 
              value={formData.additionalNotes || ''}
              onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})}
              className="w-full min-h-[100px] bg-transparent outline-none text-[15px] leading-loose text-emerald-700 print:text-black border-none resize-none"
              placeholder="Điền thêm thông tin..."
            />
          </div>`;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Remove handleAddCustomRow function
  if (content.includes('handleAddCustomRow')) {
    content = content.replace(/const handleAddCustomRow = \(\) => {[\s\S]*?setFormData\(\{ \.\.\.formData, items: newItems \}\);\n  };\n/, '');
    
    // Remove the button inside print:hidden
    content = content.replace(/<div className="mt-4 print:hidden flex justify-center">\s*<button type="button" onClick=\{handleAddCustomRow\}[\s\S]*?<\/button>\s*<\/div>/g, '');
    
    // Also GeneralDisassembly / EngineDisassembly forms have isLocked wrapper
    content = content.replace(/\{\(\!isLocked \|\| isAdmin\) && \(\s*<div className="mt-4 print:hidden flex justify-center">\s*<button type="button" onClick=\{handleAddCustomRow\}[\s\S]*?<\/button>\s*<\/div>\s*\)\}/g, '');

    changed = true;
  }

  // 2. Revert handleItemChange modifications (for Inspection forms)
  if (content.includes(`const handleItemChange = (index: number, value: string, field: string = 'actual') => {`)) {
    content = content.replace(
      /const handleItemChange = \(index: number, value: string, field: string = 'actual'\) => {[\s\S]*?setFormData\(\{ \.\.\.formData, items: newItems \}\);\n  };/,
      `const handleItemChange = (index: number, value: string) => {
    const newItems = [...formData.items];
    newItems[index].actual = value;
    setFormData({ ...formData, items: newItems });
  };`
    );
    changed = true;
  }

  // 3. Revert isCustom UI logic in tables (Inspection forms)
  const customUiRegex = /\{item\.isCustom \? \([\s\S]*?<AutoResizeTextarea[\s\S]*?\) : \(\s*(?:<div[^>]*>)?(\{item\.(?:content|unit|requirement)\})(?:<\/div>)?\s*\)\}/g;
  if(customUiRegex.test(content)) {
     content = content.replace(customUiRegex, '$1');
     content = content.replace(/<td className="border border-black p-0">\s*\{item\.content\}\s*<\/td>/g, '<td className="border border-black px-2 py-2">{item.content}</td>');
     content = content.replace(/<td className="border border-black p-0 text-center">\s*\{item\.unit\}\s*<\/td>/g, '<td className="border border-black px-2 py-2 text-center">{item.unit}</td>');
     content = content.replace(/<td className="border border-black p-0 text-center">\s*\{item\.requirement\}\s*<\/td>/g, '<td className="border border-black px-2 py-2 text-center">{item.requirement}</td>');
     
     // Remove onChange calls that pass 'actual' which we removed support for
     content = content.replace(/onChange=\{\(e\) => handleItemChange\(index, e\.target\.value, 'actual'\)\}/g, 'onChange={(e) => handleItemChange(index, e.target.value)}');
     
     changed = true;
  }

  // 4. Add the bottom text area if not exists. Append it under the main container.
  if (!content.includes('additionalNotes')) {
      const parts = content.split('</div>\n      </div>\n    </div>\n  );\n};');
      if (parts.length === 2) {
         content = parts[0] + bottomNotesHtml + '\n</div>\n      </div>\n    </div>\n  );\n};' + parts[1];
         changed = true;
      } else {
        const parts2 = content.split('</div>\n        </div>\n      </div>\n    </div>\n  );\n};');
        if (parts2.length === 2) {
          content = parts2[0] + bottomNotesHtml + '\n</div>\n        </div>\n      </div>\n    </div>\n  );\n};' + parts2[1];
          changed = true;
        }
      }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}

const fs = require('fs');
let code = fs.readFileSync('src/components/RepairRecordsTab.tsx', 'utf-8');

// I'll use a straightforward string replacement with an exact block match.
const target = `{displayedForms.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">`;

const replacementMatch = `                        </div>
                        {activeSubTabDef && (
                          <div className="flex justify-center pt-4">
                            <button
                              onClick={() => {
                                setActiveEngineFormId(undefined);
                                setShowEngineInspectionForm(true);
                              }}
                              className="flex items-center gap-2 px-6 py-2 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all shadow-sm hover:shadow"
                            >
                              <Plus className="w-5 h-5" />
                              Tạo phiếu kiểm tra
                            </button>
                          </div>
                        )}`;

const newTarget = `{displayedForms.length > 0 ? (
                      <>
                        {activeSubTabDef && (
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-stone-800">Phiếu kiểm tra đã lưu</h3>
                            <button
                              onClick={() => {
                                setActiveEngineFormId(undefined);
                                setShowEngineInspectionForm(true);
                              }}
                              className="flex items-center gap-2 px-6 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all shadow-sm hover:shadow text-sm"
                            >
                              <Plus className="w-5 h-5" />
                              Tạo phiếu kiểm tra
                            </button>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">`;

if (code.includes(target) && code.includes(replacementMatch)) {
  code = code.replace(target, newTarget);
  code = code.replace(replacementMatch, '                        </div>');
  fs.writeFileSync('src/components/RepairRecordsTab.tsx', code);
  console.log("Replaced successfully!");
} else {
  console.log("Could not find the target string.");
}

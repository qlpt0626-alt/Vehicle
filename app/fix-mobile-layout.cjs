const fs = require('fs');
let code = fs.readFileSync('src/components/RepairRecordsTab.tsx', 'utf-8');

const target = `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {displayedForms.map((form) => {
                            const dp = damageProtocols.find((p: any) => p.vehicleId === form.vehicleId);
                            const displayPlateNumber = dp?.plateNumber || 'Biển số không xác định';

                            return (
                            <div
                              key={form.id}
                              onClick={() => {
                                setActiveEngineFormId(form.id);
                                setShowEngineInspectionForm(true);
                              }}
                              className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all group relative"
                            >
                              <button
                                id="delete-button-selector"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteForm(e, form.id);
                                }}
                                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors z-10"
                                title="Xóa phiếu"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium text-stone-400 bg-stone-100 px-2 py-1 rounded-full mr-7">
                                  {formatVietnamDate(form.createdAt)}
                                </span>
                              </div>
                              <h5 className="font-bold text-stone-800 mb-1 line-clamp-1 pr-6">
                                {displayPlateNumber}
                              </h5>
                              <h6 className="font-semibold text-stone-700 mb-1 line-clamp-1 pr-6">
                                {form.templateName}
                              </h6>
                              <p className="text-sm text-stone-500 mb-1 line-clamp-1">
                                Tạo bởi: {form.createdByName}
                              </p>
                            </div>
                            );
                          })}
                        </div>`;

const newTarget = `<div className="animate-fade-in space-y-3.5">
                          {displayedForms.map((form) => {
                            const dp = damageProtocols.find((p: any) => p.vehicleId === form.vehicleId);
                            const displayPlateNumber = dp?.plateNumber || 'Biển số không xác định';

                            return (
                            <div
                              key={form.id}
                              onClick={() => {
                                setActiveEngineFormId(form.id);
                                setShowEngineInspectionForm(true);
                              }}
                              className="border border-stone-200 bg-white hover:border-stone-300 rounded-xl transition-all overflow-hidden p-4 cursor-pointer flex items-center justify-between flex-wrap gap-4 select-none"
                            >
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0 text-emerald-600">
                                  <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-[15px] text-stone-800">
                                      {displayPlateNumber}
                                    </h4>
                                    <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] font-bold rounded uppercase">
                                      {activeSubTabDef?.label || 'Chi tiết'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-stone-500 font-medium font-mono">
                                    {form.templateName}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-6 text-xs text-stone-500 font-medium">
                                <div className="flex items-center gap-1.5 hidden sm:flex">
                                  Lưu lúc: {formatVietnamDate(form.createdAt) || "Không rõ"}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  Người lập: <span className="font-bold text-stone-700">{form.createdByName || 'Người dùng'}</span>
                                </div>
                                
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDeleteForm(e, form.id);
                                    }}
                                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg transition-all cursor-pointer"
                                    title="Xóa phiếu"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                            );
                          })}
                        </div>`;

if (code.includes(target)) {
  code = code.replace(target, newTarget);
  fs.writeFileSync('src/components/RepairRecordsTab.tsx', code);
  console.log("Success");
} else {
  console.log("Failed to find target");
}
